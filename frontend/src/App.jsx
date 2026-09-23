import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

import "leaflet/dist/leaflet.css";

import "./App.css";

const API_URL = "http://localhost:7071/api/telemetry";

function App() {
  const [telemetry, setTelemetry] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTelemetry = async () => {
    try {
      const response = await axios.get(API_URL);

      const data = response.data;

      // API is newest first
      setTelemetry(data);

      setError("");
      setLoading(false);
    } catch (err) {
      console.error("API Error:", err);

      setError("Unable to connect to Azure Function");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();

    const interval = setInterval(loadTelemetry, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="loading">Loading Smart Cold Chain Dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error-page">
        <h1>Smart Cold Chain Dashboard</h1>

        <div className="error-box">🚨 {error}</div>

        <p>Make sure your Azure Function is running.</p>
      </div>
    );
  }

  const latest = telemetry[0];

  if (!latest) {
    return <div className="loading">No telemetry available.</div>;
  }

  // -----------------------------------
  // Status calculations
  // -----------------------------------

  const temperatureStatus =
    latest.temperature < 2
      ? "TOO LOW"
      : latest.temperature > 8
        ? "TOO HIGH"
        : "NORMAL";

  const temperatureClass = temperatureStatus === "NORMAL" ? "normal" : "danger";

  const doorClass = latest.door_status === "OPEN" ? "danger" : "normal";

  const alertActive = latest.alert && latest.alert !== "NONE";

  // -----------------------------------
  // Chart data
  // -----------------------------------

  const chartData = [...telemetry]
    .slice(0, 50)
    .reverse()
    .map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      temperature: Number(item.temperature),
      humidity: Number(item.humidity),
    }));

  return (
    <div className="dashboard">
      {/* HEADER */}

      <header className="header">
        <div>
          <h1>Smart Cold Chain</h1>

          <p>Real-time IoT monitoring dashboard</p>
        </div>

        <div className="connection">
          <span className="live-dot"></span>
          LIVE
        </div>
      </header>

      {/* DEVICE */}

      <section className="device-section">
        <div>
          <span className="label">DEVICE</span>

          <h2>{latest.device_id}</h2>
        </div>

        <div className="updated">
          Last updated
          <strong>{new Date(latest.timestamp).toLocaleTimeString()}</strong>
        </div>
      </section>

      {/* ALERT */}

      {alertActive && (
        <div className="alert-banner">
          <div className="alert-icon">🚨</div>

          <div>
            <strong>{latest.alert}</strong>

            <p>Immediate attention required</p>
          </div>
        </div>
      )}

      {/* CARDS */}

      <section className="cards">
        {/* Temperature */}

        <div className={`card ${temperatureClass}`}>
          <div className="card-title">🌡️ Temperature</div>

          <div className="value">
            {latest.temperature}

            <span>°C</span>
          </div>

          <div className="status">{temperatureStatus}</div>

          <small>Safe range: 2°C – 8°C</small>
        </div>

        {/* Humidity */}

        <div className="card normal">
          <div className="card-title">💧 Humidity</div>

          <div className="value">
            {latest.humidity}

            <span>%</span>
          </div>

          <div className="status">NORMAL</div>
        </div>

        {/* Door */}

        <div className={`card ${doorClass}`}>
          <div className="card-title">🚪 Door</div>

          <div className="value text">{latest.door_status}</div>

          <div className="status">
            {latest.door_status === "OPEN" ? "ALERT" : "SECURE"}
          </div>
        </div>

        {/* Alert */}

        <div className={`card ${alertActive ? "danger" : "normal"}`}>
          <div className="card-title">🚨 Alert</div>

          <div className="value text">{latest.alert || "NONE"}</div>

          <div className="status">{alertActive ? "ACTIVE" : "CLEAR"}</div>
        </div>
      </section>

      {/* CHARTS */}

      <section className="charts">
        {/* Temperature */}

        <div className="panel">
          <h2>Temperature History</h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="time" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#ef4444"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Humidity */}

        <div className="panel">
          <h2>Humidity History</h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="time" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="humidity"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* LOCATION */}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>📍 Live Location</h2>

            <p>
              {latest.latitude}, {latest.longitude}
            </p>
          </div>
        </div>

        <MapContainer
          center={[Number(latest.latitude), Number(latest.longitude)]}
          zoom={15}
          style={{
            height: "400px",
            width: "100%",
          }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker
            position={[Number(latest.latitude), Number(latest.longitude)]}
          >
            <Popup>
              <strong>{latest.device_id}</strong>
              <br />
              Temperature: {latest.temperature}°C
              <br />
              Humidity: {latest.humidity}%
              <br />
              Door: {latest.door_status}
            </Popup>
          </Marker>
        </MapContainer>
      </section>

      {/* TABLE */}

      <section className="panel">
        <h2>Recent Telemetry</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Time</th>

                <th>Temperature</th>

                <th>Humidity</th>

                <th>Door</th>

                <th>Alert</th>

                <th>Location</th>
              </tr>
            </thead>

            <tbody>
              {telemetry.slice(0, 20).map((item, index) => (
                <tr key={index}>
                  <td>{new Date(item.timestamp).toLocaleTimeString()}</td>

                  <td>{item.temperature} °C</td>

                  <td>{item.humidity} %</td>

                  <td>
                    <span
                      className={
                        item.door_status === "OPEN"
                          ? "badge danger-badge"
                          : "badge normal-badge"
                      }
                    >
                      {item.door_status}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        item.alert !== "NONE"
                          ? "badge danger-badge"
                          : "badge normal-badge"
                      }
                    >
                      {item.alert || "NONE"}
                    </span>
                  </td>

                  <td>
                    {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FOOTER */}

      <footer>
        Smart Cold Chain Monitoring System
        <span>•</span>
        Azure IoT Hub
        <span>•</span>
        Azure Functions
        <span>•</span>
        Azure Table Storage
      </footer>
    </div>
  );
}

export default App;
