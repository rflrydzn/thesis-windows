// src/pages/SessionReportPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { useParams, Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SessionReportPage = () => {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/session/${sessionId}/report`);
        setReport(response.data);
      } catch (error) {
        console.error("Error fetching session report:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  if (isLoading) return <p>Loading report...</p>;
  if (!report) return <p>Error loading report.</p>;

  // Prepare chart data using the raw readings from the report
  const labels = report.readings.map((_, index) => index + 1);
  const heartRateData = report.readings.map((r) => r.heartrate);
  const oxygenData = report.readings.map((r) => r.oxygen_level);

  const hrChartData = {
    labels: labels,
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: heartRateData,
        borderColor: 'rgb(75, 192, 192)',
        fill: false,
      },
    ],
  };

  const oxChartData = {
    labels: labels,
    datasets: [
      {
        label: 'Oxygen Saturation (%)',
        data: oxygenData,
        borderColor: 'rgb(255, 99, 132)',
        fill: false,
      },
    ],
  };

  return (
    <div>
      <h1>Session Report for Session #{sessionId}</h1>
      <div>
        <h2>Summary Statistics</h2>
        <ul>
          <li>Average Heart Rate: {report.average_heart_rate ? report.average_heart_rate.toFixed(2) : 'N/A'}</li>
          <li>Max Heart Rate: {report.max_heart_rate}</li>
          <li>Min Heart Rate: {report.min_heart_rate}</li>
          <li>Average Oxygen: {report.average_oxygen ? report.average_oxygen.toFixed(2) : 'N/A'}</li>
          <li>Max Oxygen: {report.max_oxygen}</li>
          <li>Min Oxygen: {report.min_oxygen}</li>
          <li>Desaturation Events: {report.desaturation_events}</li>
          <li>ODI (Oxygen Desaturation Index): {report.ODI ? report.ODI.toFixed(2) : 'N/A'}</li>
          <li>Total Duration (seconds): {report.recording_duration_seconds}</li>
        </ul>
      </div>
      <div>
        <h2>Heart Rate Over Time</h2>
        <Line data={hrChartData} />
      </div>
      <div>
        <h2>Oxygen Saturation Over Time</h2>
        <Line data={oxChartData} />
      </div>
      <div style={{ marginTop: '20px' }}>
        <Link to="/sessions">Back to Sessions</Link>
      </div>
    </div>
  );
};

export default SessionReportPage;
