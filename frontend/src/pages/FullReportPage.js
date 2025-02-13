// src/pages/FullReportPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
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

// Safe function to handle .toFixed() without crashing
const safeToFixed = (value, decimals = 2, unit = '') =>
    value !== undefined && value !== null ? value.toFixed(decimals) + unit : "N/A";

// A helper function to map position strings to numeric values
function mapPositionToNumber(pos) {
    console.log("Mapping Position:", pos);  // Debugging log
  
    if (!pos) return null; // Prevents undefined errors
  
    switch (pos) {
      case 'Lying on Back (Supine)': return 3;
      case 'Lying on Left Side':     return 2;
      case 'Lying on Right Side':    return 1;
      case 'Lying on Stomach (Prone)': return 0;
      case 'Sitting / Upright':      return 4;
      case 'Unknown Position':       return null; // Ignoring unknowns
      default:        
        console.warn("Unknown position received:", pos);
        return null; // or -1 for debugging
    }
  }

const FullReportPage = () => {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFullReport = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/session/${sessionId}/full_report`);
        console.log("Position Data:", response.data.trend_overview.positions);  // Debugging
        setReport(response.data);
      } catch (error) {
        console.error("Error fetching full session report:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFullReport();
  }, [sessionId]);
  

  if (isLoading) return <p>Loading full session report...</p>;
  if (!report) return <p>Error loading session report.</p>;

  // Build the dataset for the Position Graph using numeric values
  const positionNumbers = report.trend_overview?.positions?.map(mapPositionToNumber) || [];

  // For the X-axis, we can just use the index or actual time if you have timestamps
  const positionChartData = {
    labels: positionNumbers.map((_, index) => index + 1),
    datasets: [
      {
        label: 'Sleeping Position',
        data: positionNumbers,
        borderColor: 'rgb(54, 162, 235)',
        fill: false,
        stepped: 'before', // makes the line “jump” between discrete values
      },
    ],
  };

  // Configure the Y-axis to show discrete labels (Up, S, L, R, P) instead of numeric values.
  const positionChartOptions = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 4,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            switch (value) {
              case 4: return 'Up';
              case 3: return 'S'; // or 'Supine'
              case 2: return 'L'; // or 'Left'
              case 1: return 'R'; // or 'Right'
              case 0: return 'P'; // or 'Prone'
              default: return '';
            }
          },
        },
      },
      x: {
        title: {
          display: true,
          text: 'Reading # (or Time)',
        },
      },
    },
  };

  // Optional: Prepare sample chart data if your backend trend data is available.
  const oxygenTrendData = {
    labels: report.trend_overview?.oxygen_levels?.map((_, idx) => idx + 1) || [],
    datasets: [
      {
        label: 'Oxygen Saturation (%)',
        data: report.trend_overview?.oxygen_levels || [],
        borderColor: 'rgb(255, 99, 132)',
        fill: false,
      },
    ],
  };

  const heartRateTrendData = {
    labels: report.trend_overview?.heart_rates?.map((_, idx) => idx + 1) || [],
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: report.trend_overview?.heart_rates || [],
        borderColor: 'rgb(75, 192, 192)',
        fill: false,
      },
    ],
  };

  return (
    <div className="report-container">
      <h1>Sleep Study Report</h1>

      {/* 1. Overview */}
      <h2>1. Overview</h2>
      <table>
        <tbody>
          <tr>
            <td><strong>Apnea-Hypopnea Index (AHI):</strong></td>
            <td>{safeToFixed(report.overview?.AHI, 2, " /h")}</td>
          </tr>
          <tr>
            <td><strong>Oxygen Desaturation Index (ODI):</strong></td>
            <td>{safeToFixed(report.overview?.ODI, 2, " /h")}</td>
          </tr>
          <tr>
            <td><strong>Snore Percentage:</strong></td>
            <td>{safeToFixed(report.overview?.Snore_Percentage, 2, " %")}</td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 2. Respiratory Indices */}
      <h2>2. Respiratory Indices</h2>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Total</th>
            <th>Supine</th>
            <th>Non-Supine</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Apneas + Hypopneas (AHI)</strong></td>
                <td>{safeToFixed(report.respiratory_indices?.AHI_Total, 2, " /h")}</td>
                <td>{safeToFixed(report.respiratory_indices?.AHI_Supine, 2, " /h")}</td>
                <td>{safeToFixed(report.respiratory_indices?.AHI_NonSupine, 2, " /h")}</td>
                <td>{report.respiratory_indices?.AHI_Count || "N/A"}</td>
            </tr>
            <tr>
                <td><strong>Apneas</strong></td>
                <td>{safeToFixed(report.respiratory_indices?.Apneas_Total, 2, " /h")}</td>
                <td>{safeToFixed(report.respiratory_indices?.Apneas_Supine, 2, " /h")}</td>
                <td>{safeToFixed(report.respiratory_indices?.Apneas_NonSupine, 2, " /h")}</td>
                <td>{report.respiratory_indices?.Apneas_Count || "N/A"}</td>
            </tr>
            <tr>
                <td>- Obstructive (OA)</td>
                <td colSpan="4">{report.respiratory_indices?.Obstructive_Apneas_Count || "N/A"}</td>
            </tr>
            <tr>
                <td><strong>Hypopneas</strong></td>
                <td>{safeToFixed(report.respiratory_indices?.Hypopneas_Total, 2, " /h")}</td>
                <td>{safeToFixed(report.respiratory_indices?.Hypopneas_Supine, 2, " /h")}</td>
                <td>{safeToFixed(report.respiratory_indices?.Hypopneas_NonSupine, 2, " /h")}</td>
                <td>{report.respiratory_indices?.Hypopneas_Count || "N/A"}</td>
            </tr>
            <tr>
                <td>- Obstructive (OH)</td>
                <td colSpan="4">{report.respiratory_indices?.Obstructive_Hypopneas_Count || "N/A"}</td>
            </tr>
        </tbody>
      </table>

      <hr />

      {/* 3. Snoring & Breathing Events */}
      <h2>3. Snoring &amp; Breathing Events</h2>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Percentage of Sleep</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
        <tr>
            <td><strong>Snoring</strong></td>
            <td>{safeToFixed(report.snoring_events?.Percentage, 2, " %")}</td>
            <td>{safeToFixed(report.snoring_events?.Duration, 1, " min")}</td>
        </tr>
        </tbody>
      </table>

      <hr />

      {/* 4. Oxygen Saturation (SpO2) */}
      <h2>4. Oxygen Saturation (SpO₂)</h2>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Total</th>
            <th>Supine</th>
            <th>Non-Supine</th>
          </tr>
        </thead>
        <tbody>
        <tr>
            <td><strong>Oxygen Desaturation Index (ODI)</strong></td>
            <td>{safeToFixed(report.oxygen_saturation?.ODI_Total, 2, " /h")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.ODI_Supine, 2, " /h")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.ODI_NonSupine, 2, " /h")}</td>
        </tr>
        <tr>
            <td><strong>Average SpO₂</strong></td>
            <td>{safeToFixed(report.oxygen_saturation?.Average_SpO2, 1, " %")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.Average_SpO2_Supine, 1, " %")}</td>
            <td>{safeToFixed(report.oxygen_saturation?.Average_SpO2_NonSupine, 1, " %")}</td>
        </tr>
          <tr>
            <td><strong>Minimum SpO₂</strong></td>
            <td>{report.oxygen_saturation?.Minimum_SpO2 ? report.oxygen_saturation.Minimum_SpO2 + " %" : "N/A"}</td>
            <td>{report.oxygen_saturation?.Minimum_SpO2_Supine ? report.oxygen_saturation.Minimum_SpO2_Supine + " %" : "N/A"}</td>
            <td>{report.oxygen_saturation?.Minimum_SpO2_NonSupine ? report.oxygen_saturation.Minimum_SpO2_NonSupine + " %" : "N/A"}</td>
          </tr>
          <tr>
            <td><strong>SpO₂ Duration &lt; 90%</strong></td>
            <td>{report.oxygen_saturation?.Duration_below_90 ? report.oxygen_saturation.Duration_below_90 + " min" : "N/A"}</td>
            <td>N/A</td>
            <td>N/A</td>
          </tr>
          <tr>
            <td><strong>SpO₂ Duration &lt; 88%</strong></td>
            <td>{report.oxygen_saturation?.Duration_below_88 ? report.oxygen_saturation.Duration_below_88 + " min" : "N/A"}</td>
            <td>N/A</td>
            <td>N/A</td>
          </tr>
          <tr>
            <td><strong>SpO₂ Duration &lt; 85%</strong></td>
            <td>{report.oxygen_saturation?.Duration_below_85 ? report.oxygen_saturation.Duration_below_85 + " min" : "N/A"}</td>
            <td>N/A</td>
            <td>N/A</td>
          </tr>
          <tr>
            <td><strong>Average Desaturation Drop</strong></td>
            <td>{safeToFixed(report.oxygen_saturation?.Average_Desaturation_Drop, 1, " %")}</td>
            <td>N/A</td>
            <td>N/A</td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 5. Sleep Position & Time Analysis */}
      <h2>5. Sleep Position &amp; Time Analysis</h2>
      <table>
        <thead>
          <tr>
            <th>Position</th>
            <th>Duration (min)</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(report.position_analysis?.position_durations_minutes || {}).map(([pos, dur]) => (
            <tr key={pos}>
                <td>{pos}</td>
                <td>{safeToFixed(dur, 1)}</td>
                <td>
                    {report.position_analysis?.position_percentages &&
                    report.position_analysis.position_percentages[pos] !== null
                        ? safeToFixed(report.position_analysis.position_percentages[pos], 1, " %")
                        : "N/A"}
                </td>
            </tr>
          ))}
        <tr>
            <td><strong>Supine (TST)</strong></td>
            <td>{safeToFixed(report.position_analysis?.Supine_TST, 1)}</td>
            <td>N/A</td>
        </tr>
        <tr>
            <td><strong>Non-Supine (TST)</strong></td>
            <td>{safeToFixed(report.position_analysis?.NonSupine_TST, 1)}</td>
            <td>N/A</td>
        </tr>
        <tr>
            <td>- Left (TST)</td>
            <td>{safeToFixed(report.position_analysis?.Left_TST, 1)}</td>
            <td>N/A</td>
        </tr>
        <tr>
            <td>- Prone (TST)</td>
            <td>{safeToFixed(report.position_analysis?.Prone_TST, 1)}</td>
            <td>N/A</td>
        </tr>
        <tr>
            <td>- Right (TST)</td>
            <td>{safeToFixed(report.position_analysis?.Right_TST, 1)}</td>
            <td>N/A</td>
        </tr>
        <tr>
            <td><strong>Upright (TRT)</strong></td>
            <td>{safeToFixed(report.position_analysis?.Upright, 1)}</td>
            <td>N/A</td>
        </tr>
        </tbody>
      </table>

      <hr />

      {/* 6. Pulse & Heart Rate */}
      <h2>6. Pulse &amp; Heart Rate</h2>
      <table>
        <tbody>
          <tr>
            <td><strong>Average Pulse</strong></td>
            <td>{safeToFixed(report.pulse?.Average_Heart_Rate, 1, " bpm")}</td>
          </tr>
          <tr>
            <td><strong>Maximum Pulse</strong></td>
            <td>{report.pulse?.Maximum_Heart_Rate ? report.pulse.Maximum_Heart_Rate + " bpm" : "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Minimum Pulse</strong></td>
            <td>{report.pulse?.Minimum_Heart_Rate ? report.pulse.Minimum_Heart_Rate + " bpm" : "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Duration &lt; 40 bpm</strong></td>
            <td>{safeToFixed(report.pulse?.Duration_below_40_minutes, 1, " min")}</td>
        </tr>
            <tr>
            <td><strong>Duration &gt; 100 bpm</strong></td>
            <td>{safeToFixed(report.pulse?.Duration_above_100_minutes, 1, " min")}</td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 7. Signal Quality */}
      <h2>7. Signal Quality</h2>
      <table>
      <tbody>
        <tr>
            <td><strong>Oximeter</strong></td>
            <td>{safeToFixed(report.signal_quality?.Average_Oximeter_Quality, 1, " %")}</td>
        </tr>
        <tr>
            <td><strong>RIP Belts</strong></td>
            <td>{safeToFixed(report.signal_quality?.Average_RIP_Quality, 0, " %")}</td>
        </tr>
    </tbody>
      </table>

      <hr />

      {/* 8. Trend Overview (Graphical Data) */}
      <h2>8. Trend Overview (Graphical Data)</h2>
      <div className="chart-container">
        <h3>Movement Graph</h3>
        {/* Placeholder for Movement Graph */}
      </div>
      <div className="chart-container">
        <h3>Position Graph</h3>
        <Line data={positionChartData} options={positionChartOptions} />
      </div>
      <div className="chart-container">
        <h3>Apnea Events</h3>
        {/* Placeholder for Apnea Events Graph */}
      </div>
      <div className="chart-container">
        <h3>Hypopnea Events</h3>
        {/* Placeholder for Hypopnea Events Graph */}
      </div>
      <div className="chart-container">
        <h3>Desaturation Events</h3>
        {/* Placeholder for Desaturation Events Graph */}
      </div>
      <div className="chart-container">
        <h3>SpO₂ Trends</h3>
        <Line data={oxygenTrendData} />
      </div>
      <div className="chart-container">
        <h3>Pulse Trends</h3>
        <Line data={heartRateTrendData} />
      </div>
      <div className="chart-container">
        <h3>Snoring Train</h3>
        {/* Placeholder for Snoring Train Graph */}
      </div>
      <div className="chart-container">
        <h3>Limitation Trends</h3>
        {/* Placeholder for Limitation Trends Graph */}
      </div>

      <hr />

      {/* Navigation */}
      <div style={{ marginTop: '20px' }}>
        <Link to="/sessions">Back to Sessions</Link>
      </div>
    </div>
  );
};

export default FullReportPage;