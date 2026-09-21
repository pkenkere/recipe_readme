from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class IngredientBase(BaseModel):
    name: str
    category: str = "other"
    quantity: float = 0
    unit: str = "item"
    expiry_date: Optional[date] = None
    in_stock: bool = True


class IngredientCreate(IngredientBase):
    pass


class IngredientRead(IngredientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
