"""app/routes/clothing.py - Endpoints pour gérer le dressing."""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db
from app.models.clothing import Clothing
from app.schemas.clothing import (
    ClothingCreate,
    ClothingResponse,
    ClothingUpdate,
)


router = APIRouter(prefix="/clothing", tags=["clothing"])


@router.post("/", response_model=ClothingResponse)
async def create_clothing(
    clothing: ClothingCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Crée un nouvel article de vêtement dans le dressing."""
    new_clothing = Clothing(
        user_id=user_id,
        name=clothing.name,
        type=clothing.type,
        color=clothing.color,
        style=clothing.style,
        pattern=clothing.pattern,
        brand=clothing.brand,
        price=clothing.price,
        description=clothing.description,
        image_url=clothing.image_url,
        image_bg_removed_url=clothing.image_url,  # TODO: Process with remove.bg
    )
    db.add(new_clothing)
    db.commit()
    db.refresh(new_clothing)
    return new_clothing


@router.post("/upload", response_model=ClothingResponse)
async def upload_clothing_with_image(
    file: UploadFile = File(...),
    name: str = Form(...),
    type: str = Form(...),
    color: str = Form(...),
    style: str = Form(None),
    pattern: str = Form(None),
    brand: str = Form(None),
    price: float = Form(None),
    description: str = Form(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Télécharge une photo de vêtement, la sauvegarde,
    traite avec remove.bg (extraction du fond), et crée l'article.
    """
    # TODO: Sauvegarder le fichier uploadé
    # TODO: Appeler remove_bg_service pour traiter l'image
    # TODO: Générer les URLs des images stockées

    # Placeholder: utiliser l'URL directe du fichier
    image_url = f"/uploads/clothing/{user_id}/{file.filename}"
    image_bg_removed_url = f"/uploads/clothing/{user_id}/no-bg-{file.filename}"

    clothing = ClothingCreate(
        name=name,
        type=type,
        color=color,
        style=style,
        pattern=pattern,
        brand=brand,
        price=price,
        description=description,
        image_url=image_url,
    )

    new_clothing = Clothing(
        user_id=user_id,
        name=clothing.name,
        type=clothing.type,
        color=clothing.color,
        style=clothing.style,
        pattern=clothing.pattern,
        brand=clothing.brand,
        price=clothing.price,
        description=clothing.description,
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
    user_id: int = Depends(get_current_user_id),
):
    """Récupère tous les articles du dressing de l'utilisateur."""
    items = db.query(Clothing).filter(Clothing.user_id == user_id).all()
    return items


@router.get("/{clothing_id}", response_model=ClothingResponse)
async def get_clothing(
    clothing_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Récupère les détails d'un article spécifique."""
    item = db.query(Clothing).filter(
        Clothing.id == clothing_id,
        Clothing.user_id == user_id,
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    return item


@router.put("/{clothing_id}", response_model=ClothingResponse)
async def update_clothing(
    clothing_id: int,
    clothing: ClothingUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Met à jour les détails d'un article."""
    item = db.query(Clothing).filter(
        Clothing.id == clothing_id,
        Clothing.user_id == user_id,
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    update_data = clothing.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{clothing_id}", status_code=204)
async def delete_clothing(
    clothing_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Supprime un article du dressing."""
    item = db.query(Clothing).filter(
        Clothing.id == clothing_id,
        Clothing.user_id == user_id,
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    db.delete(item)
    db.commit()
