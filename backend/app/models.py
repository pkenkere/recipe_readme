from sqlalchemy import Boolean, Column, Date, Float, Integer, String

from .database import Base


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, default="other")
    quantity = Column(Float, default=0)
    unit = Column(String, default="item")
    expiry_date = Column(Date, nullable=True)
    in_stock = Column(Boolean, default=True)
