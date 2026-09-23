import axios from "axios";

const API_URL = "http://localhost:7071/api";

export const getTelemetry = async () => {
  const response = await axios.get(`${API_URL}/telemetry`);
  return response.data;
};
