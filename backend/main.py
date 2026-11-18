
import os
import asyncio
import httpx

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Atmos Weather API")

# Allow requests from your GitHub Pages website and local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://jodaaisha2-blip.github.io",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Your API key will be added securely through Render's environment variables
API_KEY = os.getenv("OPENWEATHER_API_KEY")

# Country names mapped to their capitals
COUNTRY_CAPITALS = {
    "nigeria": "Abuja,NG",
    "india": "New Delhi,IN",
    "united kingdom": "London,GB",
    "uk": "London,GB",
    "great britain": "London,GB",
    "united states": "Washington,US",
    "usa": "Washington,US",
    "canada": "Ottawa,CA",
    "ghana": "Accra,GH",
    "kenya": "Nairobi,KE",
    "south africa": "Pretoria,ZA",
    "egypt": "Cairo,EG",
    "france": "Paris,FR",
    "germany": "Berlin,DE",
    "japan": "Tokyo,JP",
    "china": "Beijing,CN",
    "australia": "Canberra,AU",
    "brazil": "Brasilia,BR",
    "italy": "Rome,IT",
    "spain": "Madrid,ES",
    "saudi arabia": "Riyadh,SA",
    "uae": "Abu Dhabi,AE",
    "united arab emirates": "Abu Dhabi,AE",
    "qatar": "Doha,QA",
    "turkey": "Ankara,TR",
    "rwanda": "Kigali,RW",
    "uganda": "Kampala,UG",
    "tanzania": "Dodoma,TZ",
    "senegal": "Dakar,SN",
    "ethiopia": "Addis Ababa,ET",
}


@app.get("/")
def home():
    return {"message": "Atmos Weather API is running!"}


@app.get("/api/weather")
async def get_weather(city: str):

    if not API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Weather API key is not configured."
        )

    city = city.strip()

    if not city:
        raise HTTPException(
            status_code=400,
            detail="Please enter a city name."
        )

    # Convert a country name to its capital where available
    search_term = COUNTRY_CAPITALS.get(city.lower(), city)

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            # Find the city's geographical coordinates
            geo_response = await client.get(
                "https://api.openweathermap.org/geo/1.0/direct",
                params={
                    "q": search_term,
                    "limit": 1,
                    "appid": API_KEY
                }
            )

            geo_response.raise_for_status()
            locations = geo_response.json()

            if not locations:
                raise HTTPException(
                    status_code=404,
                    detail=f"We couldn't find '{city}'. Check the spelling and try again."
                )

            location = locations[0]

            # Prepare the weather request
            params = {
                "lat": location["lat"],
                "lon": location["lon"],
                "units": "metric",
                "appid": API_KEY
            }

            # Fetch current weather and forecast together
            current, forecast = await asyncio.gather(
                client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params=params
                ),
                client.get(
                    "https://api.openweathermap.org/data/2.5/forecast",
                    params=params
                )
            )

            current.raise_for_status()
            forecast.raise_for_status()

            return {
                "current": current.json(),
                "forecast": forecast.json()
            }

        except HTTPException:
            raise

        except httpx.HTTPStatusError:
            raise HTTPException(
                status_code=502,
                detail="The weather provider returned an error. Please try again."
            )

        except httpx.RequestError:
            raise HTTPException(
                status_code=503,
                detail="Could not connect to the weather provider. Check your connection."
            )
