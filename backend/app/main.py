from typing import List

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models
from .database import Base, SessionLocal, engine, get_db
from .schemas import IngredientCreate, IngredientRead

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pantry Inventory API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/ingredients", response_model=List[IngredientRead])
def list_ingredients(db: Session = Depends(get_db)):
    return db.query(models.Ingredient).all()


@app.post("/ingredients", response_model=IngredientRead)
def create_ingredient(ingredient: IngredientCreate, db: Session = Depends(get_db)):
    db_item = models.Ingredient(**ingredient.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.delete("/ingredients/{ingredient_id}")
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Ingredient).filter(models.Ingredient.id == ingredient_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    db.delete(item)
    db.commit()
    return {"deleted": True}


@app.delete("/ingredients/{ingredient_id}/quantity")
def remove_ingredient_quantity(
    ingredient_id: int,
    amount: float = Query(default=1.0, gt=0),
    db: Session = Depends(get_db),
):
    item = db.query(models.Ingredient).filter(models.Ingredient.id == ingredient_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    removed = min(float(amount), float(item.quantity))
    remaining_quantity = max(0, float(item.quantity) - float(amount))

    if remaining_quantity == 0:
        item_id = item.id
        item_name = item.name
        db.delete(item)
        db.commit()
        return {
            "id": item_id,
            "name": item_name,
            "quantity": 0,
            "in_stock": False,
            "removed": removed,
            "deleted": True,
        }

    item.quantity = remaining_quantity
    item.in_stock = True
    db.commit()
    db.refresh(item)

    return {
        "id": item.id,
        "name": item.name,
        "quantity": item.quantity,
        "in_stock": item.in_stock,
        "removed": removed,
        "deleted": False,
    }


@app.post("/ingredients/{ingredient_id}/quantity", response_model=IngredientRead)
def add_ingredient_quantity(
    ingredient_id: int,
    amount: float = Query(default=1.0, gt=0),
    db: Session = Depends(get_db),
):
    item = db.query(models.Ingredient).filter(models.Ingredient.id == ingredient_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    item.quantity = float(item.quantity) + float(amount)
    item.in_stock = True
    db.commit()
    db.refresh(item)
    return item
