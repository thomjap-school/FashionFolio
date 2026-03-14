"""app/routes/clothing.py - Endpoints pour gérer le dressing."""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session

from app.models.user import User
from app.dependencies.auth import get_current_user
from app.core.database import get_db
from app.models.clothing import Clothing
from app.schemas.clothing import (
    ClothingCreate,
    ClothingResponse,
    ClothingUpdate,
)
from app.services.remove_bg_service import process_clothing_image
from app.services.image_recognition import recognize_clothing


router = APIRouter(prefix="/clothing", tags=["clothing"])

UPLOAD_ROOT = Path("uploads/clothing")


@router.post("/", response_model=ClothingResponse)
async def create_clothing(
    clothing: ClothingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_clothing = Clothing(
        user_id=current_user.id,
        name=clothing.name,
        type=clothing.type,
        color=clothing.color,
        style=clothing.style,
        pattern=clothing.pattern,
        brand=clothing.brand,
        price=clothing.price,
        description=clothing.description,
        image_url=clothing.image_url,
        image_bg_removed_url=clothing.image_url,
    )
    db.add(new_clothing)
    db.commit()
    db.refresh(new_clothing)
    return new_clothing


@router.post("/upload", response_model=ClothingResponse)
async def upload_clothing_with_image(
    file: UploadFile = File(...),
    name: str = Form(None),
    type: str = Form(None),
    color: str = Form(None),
    style: str = Form(None),
    pattern: str = Form(None),
    brand: str = Form(None),
    price: float = Form(None),
    description: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_upload_dir = UPLOAD_ROOT / str(current_user.id)
    user_upload_dir.mkdir(parents=True, exist_ok=True)

    unique_prefix = uuid.uuid4().hex[:8]
    original_filename = f"{unique_prefix}_{file.filename}"
    original_path = user_upload_dir / original_filename

    content = await file.read()
    with open(original_path, "wb") as f:
        f.write(content)

    # Nettoyer les valeurs "string" par défaut de Swagger
    def clean(v):
        return None if v in ("string", "", "0") else v

    name = clean(name)
    type = clean(type)
    color = clean(color)
    style = clean(style)
    pattern = clean(pattern)
    brand = clean(brand)
    description = clean(description)

    try:
        image_url, image_bg_removed_url = await (
            process_clothing_image(str(original_path), current_user.id)
        )
    except Exception as e:
        print(f"[remove.bg] Erreur : {e}")
        image_url = f"/uploads/clothing/{current_user.id}/{original_filename}"
        image_bg_removed_url = image_url

    try:
        detected = await recognize_clothing(str(original_path))
        name = name or detected.get("name")
        type = type or detected.get("type", "other")
        color = color or detected.get("color", "unknown")
        style = style or detected.get("style")
        pattern = pattern or detected.get("pattern")
        description = description or detected.get("description")
    except Exception as e:
        print(f"[image_recognition] Erreur : {e}")
        type = type or "other"
        color = color or "unknown"

    new_clothing = Clothing(
        user_id=current_user.id,
        name=name,
        type=type,
        color=color,
        style=style,
        pattern=pattern,
        brand=brand,
        price=price,
        description=description,
        image_url=image_url,
        image_bg_removed_url=image_bg_removed_url,
    )
    db.add(new_clothing)
    db.commit()
    db.refresh(new_clothing)
    return new_clothing


@router.get("/", response_model=list[ClothingResponse])
async def get_wardrobe(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(Clothing)
        .filter(Clothing.user_id == current_user.id)
        .all()
    )
    return items


@router.get("/stats")
async def get_wardrobe_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = db.query(Clothing).filter_by(user_id=current_user.id).all()

    if not items:
        return {"total": 0}

    from collections import Counter

    types = Counter(item.type for item in items if item.type)
    colors = Counter(item.color for item in items if item.color)
    styles = Counter(item.style for item in items if item.style)

    return {
        "total": len(items),
        "by_type": dict(types.most_common()),
        "by_color": dict(colors.most_common()),
        "by_style": dict(styles.most_common()),
        "most_common_type": types.most_common(1)[0][0] if types else None,
        "most_common_color": colors.most_common(1)[0][0] if colors else None,
    }


@router.get("/{clothing_id}", response_model=ClothingResponse)
async def get_clothing(
    clothing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Clothing).filter(
        Clothing.id == clothing_id,
        Clothing.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    return item


@router.put("/{clothing_id}", response_model=ClothingResponse)
async def update_clothing(
    clothing_id: int,
    clothing: ClothingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Clothing).filter(
        Clothing.id == clothing_id,
        Clothing.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    update_data = clothing.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{clothing_id}", status_code=200)
async def delete_clothing(
    clothing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Clothing).filter(
        Clothing.id == clothing_id,
        Clothing.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    db.delete(item)
    db.commit()
    return {"message": f"Article {clothing_id} supprimé avec succès"}
