<div align="center">
  <img src="frontend/public/favicon.svg" alt="AstramAI Logo" width="120" height="120">
  
  # AstramAI: Smart Traffic Command Center
  
  **AI-Powered Congestion Impact Predictor & Smart Resource Deployment System**  
  *Built on 8,200+ real Bengaluru Traffic Police (BTP) Astram records.*
</div>

---

## 🚦 The Problem
Bengaluru is one of the most congested cities in the world. The Bengaluru Traffic Police (BTP) responds to thousands of events annually—ranging from minor vehicle breakdowns to severe accidents, water logging, and massive public processions. 

Currently, resource deployment (how many officers, what equipment) is handled manually based on gut instinct. This leads to **wasted manpower** (over-deployment to minor issues) and **city gridlock** (under-deployment to severe bottlenecks), with zero predictive forecasting.

## 🚀 The Solution: AstramAI
AstramAI is an end-to-end Machine Learning pipeline and interactive command center. It transforms reactive policing into **proactive, data-driven intelligence**.

By analyzing 8,200+ real historical events, AstramAI predicts exactly how long a new traffic incident will take to clear and automatically recommends the optimal resource deployment—translating AI insights into immediate operational directives.

---

## ✨ Key Features

### 1. ML-Powered Impact Predictor
Using Scikit-Learn's **Gradient Boosting Regressor & Classifier** (with 5-fold cross-validation), AstramAI takes event details (cause, zone, priority, time of day) and instantly predicts:
- **Expected Resolution Time** (in hours)
- **Severity Assessment** (Low, Medium, High)

### 2. Smart Resource Recommender
A hybrid ML-rules engine that automatically generates a deployment plan:
- **Personnel Required**: Dynamically scales based on predicted duration and severity.
- **Equipment to Dispatch**: Context-aware gear (e.g., Ambulances for accidents, Barricades for processions).
- **Operational Directives**: Pre-written commands for instant dispatch.

### 3. Unique "Wow" Factors
- 🏛️ **Historical Precedents (AI Case Law)**: Solves the "Black Box" AI problem by fetching the Top 5 most similar past events, showing commanders exactly what historical data the AI is basing its prediction on.
- 🌍 **Economic & Environmental Impact Calculator**: Translates traffic delays into real-world metrics: estimated **Vehicles Delayed**, **Productivity Loss (₹)**, and **Excess CO₂ Emissions (Tons)**.

### 4. Interactive Command Center
- **Hotspot Heatmap**: CartoDB dark-themed interactive map with dynamic zone filtering and Leaflet heat layers.
- **Zone Risk Matrix**: A temporal heatmap crossing BTP Zones by Day of the Week to help police pre-position resources *before* gridlock happens.
- **Event History**: Full searchable, filterable audit log of all events.
- **Live Analytics Dashboard**: Visualizing monthly trends, top causes, and ML model performance metrics.

---

## 🛠️ Technology Stack

**Frontend**
- React 18 + Vite (Single Page Application)
- Tailwind CSS (Utility-first styling)
- Recharts (Data visualization)
- React Leaflet + CartoDB (Interactive mapping)
- Lucide React (Icons)

**Backend & Machine Learning**
- FastAPI (High-performance Python REST API)
- Scikit-Learn (Gradient Boosting models)
- Pandas & NumPy (Data manipulation & feature engineering)
- Uvicorn (ASGI web server)

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js (v18+)
- Python (3.9+)

### 1. Start the Backend
The backend requires the CSV dataset to train the ML models in-memory on startup.
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
*The backend will run on `http://localhost:8000`. Wait for the console to say "Initialization complete" (this means the ML models are trained).*

### 2. Start the Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173`.*

---

## 🌐 Deployment
This architecture is designed to be split across two services due to the ML model's memory requirements:
1. **Backend**: Deployed on [Render.com](https://render.com) (Web Service).
2. **Frontend**: Deployed on [Vercel](https://vercel.com). Environment variable `VITE_API_URL` is configured to point to the live Render backend URL.

---

## 🧠 ML Architecture Note
To prevent **Data Leakage**, the severity score is computed using strictly causal features (priority, cause, road closure). The event *duration* is deliberately excluded from severity calculations. Furthermore, to handle extreme outliers inherent in traffic data (e.g., 1000+ hour construction events), the target duration variable is `log1p` transformed before training and inverted via `expm1` upon prediction, resulting in highly stabilized, realistic forecasts.
