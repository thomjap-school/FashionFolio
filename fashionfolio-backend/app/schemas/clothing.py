from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base
from datetime import datetime


class Clothing(Base):
    __tablename__ = "clothing"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    color = Column(String)
    style = Column(String)
    pattern = Column(String)
    brand = Column(String)
    price = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
