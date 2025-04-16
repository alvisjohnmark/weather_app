import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThreeDot } from "react-loading-indicators";
import { Droplets, Wind, Thermometer, Cloudy } from "lucide-react";
import "../home.css";

interface WeatherData {
  name: string;
  main: {
    temp: number;
    humidity: number;
    feels_like: number;
  };
  weather: { description: string }[];
  wind: { speed: number };
}

interface ForecastItem {
  dt_txt: string;
  main: { temp: number };
  weather: { description: string }[];
}

interface ForecastData {
  list: ForecastItem[];
}

const Home = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );
        if (!response.ok) {
          throw new Error("Network error");
        }
        const data = await response.json();
        setWeather(data);

        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );
        const forecastData = await forecastResponse.json();
        setForecast(forecastData);
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          fetchWeather(lat, lon);
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
          //manila if failed
          fetchWeather(14.5995, 120.9842);
        }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
      //manila if failed
      fetchWeather(14.5995, 120.9842);
    }
  }, []);

  const groupForecastByDay = () => {
    if (!forecast) return [];
    const grouped: { [key: string]: any[] } = {};
    forecast.list.forEach((item: any) => {
      const date = new Date(item.dt_txt).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return Object.entries(grouped).slice(0, 5);
  };

  const getHourlyForecast = () => {
    if (!forecast) return [];
    return forecast.list.slice(0, 9);
  };

  useEffect(() => {
    if (error) {
      console.error("Error fetching weather data:", error);
    }
  }, [error]);

  const suggestionInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setLocation(input);

    if (input.length > 2) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/autocomplete?input=${input}`
        );

        const data = await response.json();
        setSuggestions(data.predictions || []);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const clickSuggestion = async (input: string) => {
    setLoading(true);
    setSuggestions([]);
    try {
      const weatherApiKey = import.meta.env.VITE_WEATHER_API_KEY;
      const response = await fetch(
        `http://localhost:5000/api/place/details?input=${input}`
      );
      if (!response.ok) {
        throw new Error("Network error");
      }
      const data = await response.json();
      const { lat, lng } = data.result.geometry.location;
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${weatherApiKey}&units=metric`
      );
      const weatherData = await weatherResponse.json();
      setWeather(weatherData);
      const forecast = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${weatherApiKey}&units=metric`
      );
      const forecastData = await forecast.json();
      setForecast(forecastData);
      setLocation("");
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="home-container min-h-screen px-4 py-6 flex flex-col items-start sm:items-center justify-start sm:justify-center overflow-y-auto">
        <div className="w-full max-w-6xl mb-6 flex flex-col sm:flex-row items-stretch gap-3 relative">
          <Input
            type="text"
            placeholder="Enter a place..."
            className="w-full sm:w-auto flex-1"
            value={location}
            onChange={suggestionInput}
          />

          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white shadow-lg z-10 max-h-[200px] overflow-y-auto rounded-md border">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    clickSuggestion(suggestion.place_id);
                  }}
                >
                  {suggestion.description}
                </div>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <ThreeDot
            text=" Loading..."
            color={["#309ddf", "#5db2e6", "#89c7ed", "#b5dcf4"]}
          />
        ) : (
          <Card className="max-w-6xl mx-auto w-full p-4 sm:p-6 md:p-8 bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row">
            {/* Left section */}
            <div className="flex-[2] flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-300 pb-6 md:pb-0 md:pr-6">
              <div>
                <div className="flex justify-between mb-4 text-sm md:text-base">
                  <p className="text-gray-600">{weather?.name || "Location"}</p>
                  <p className="text-gray-600">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>

                <div className="text-center">
                  <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold text-gray-800">
                    {weather?.main?.temp ?? "--"}°
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-500 capitalize">
                    {weather?.weather?.[0]?.description ?? "Loading"}
                  </p>

                  <div className="flex justify-center flex-wrap gap-4 mt-6 text-gray-600 text-sm">
                    <div className="flex items-center gap-1">
                      <Wind size={18} color="#919191" strokeWidth={1} />
                      <span>{weather?.wind?.speed ?? "--"} mph</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets size={18} color="#0a5cff" strokeWidth={1} />
                      <span>{weather?.main?.humidity ?? "--"}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Forecast */}
              <div className="flex justify-between flex-wrap gap-2 mt-6">
                {groupForecastByDay().map(([date, items], index) => {
                  const avgTemp =
                    items.reduce((sum, item) => sum + item.main.temp, 0) /
                    items.length;
                  const weatherDescription = items[0].weather[0].description;
                  return (
                    <div
                      key={index}
                      className={`text-center px-3 py-2 rounded-xl border ${
                        index === 0 ? "bg-gray-200" : "bg-white"
                      } text-sm text-gray-600  w-[48%] sm:w-[15%]`}
                    >
                      <p>
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </p>
                      <p>{Math.round(avgTemp)}°</p>
                      <p className="text-xs capitalize">{weatherDescription}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right section */}
            <div className="flex-[1] md:pl-6 flex flex-col justify-between">
              <div>
                <p className="text-xl sm:text-2xl text-gray-800 font-bold">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="mt-6 space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-1">
                  <Thermometer size={18} color="#ff4d4d" strokeWidth={1} />
                  Feels like: {weather?.main?.feels_like ?? "--"}°C
                </p>
                <p className="flex items-center gap-1">
                  <Cloudy size={18} color="#919191" strokeWidth={1} />
                  {weather?.weather?.[0]?.description}
                </p>
              </div>

              {/* Hourly Forecast */}
              <div>
                <h3 className="mt-8 mb-3 font-semibold text-gray-700">
                  Hourly Forecast
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {getHourlyForecast().map((hour, i) => (
                    <div
                      key={i}
                      className="p-2 text-center rounded-xl bg-gray-100 text-sm text-gray-700"
                    >
                      <p>
                        {new Date(hour.dt_txt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p>{Math.round(hour.main.temp)}°</p>
                      <p className="text-xs capitalize">
                        {hour.weather[0].description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

export default Home;
