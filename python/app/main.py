from fastapi import FastAPI
import uvicorn

app = FastAPI(title='handmade-python-service')

@app.get('/health')
def health():
    return {"ok": True}

# Demo endpoint: simple recommendation stub
@app.post('/recommend')
def recommend(payload: dict):
    # payload example: {"category": "Свечи"}
    category = payload.get('category')
    return {"recommended": ["Подарочная упаковка", f"Аксессуар для {category}"]}

def main():
    uvicorn.run(app, host='0.0.0.0', port=9001)

