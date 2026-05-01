# AI Finance Supervisor Explanation

This feature uses a machine learning regression model trained on realistic historical hotel demo data. It forecasts future revenue and occupancy, then generates pricing recommendations for each room type using a bounded business policy based on the model predictions. Spring Boot handles business data and security, while FastAPI serves the trained ML model.

## Two-minute explanation script

"AI Finance is a Manager-only feature in Roomify. The dashboard starts with real Spring Boot analytics: reservations, revenue, occupancy, expenses, room types, and historical trends.

For the AI part, we trained a regression model on realistic hotel demo data because this graduation project is not connected to a production hotel database. The model predicts future revenue and occupancy. FastAPI serves the trained model, but React never calls FastAPI directly. React calls Spring Boot only, and Spring Boot handles authentication, Manager authorization, business data, timeout handling, and fallback behavior.

The Revenue Forecast and Occupancy Forecast sections show future prediction metrics and forecast points. The Pricing Recommendations section is advisory only. It uses a bounded business policy based on the model predictions so suggestions remain conservative and explainable. The dashboard does not apply price changes.

The AI Insights panel uses predefined demo-safe buttons instead of free-text chat. Each button calls Spring Boot `/api/ai-finance/ask` with a supported intent. If FastAPI is unavailable, Spring Boot returns a deterministic safe demo fallback and the UI clearly labels it as fallback data."

## Key points to remember

- React calls Spring Boot only.
- Spring Boot calls FastAPI.
- FastAPI loads the trained ML model artifacts.
- The route and endpoints are Manager-only.
- Fallback data is safe demo fallback, not cached live AI output.
- Pricing recommendations are advisory and bounded.
