import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SummariesChart = () => {
  // Generate mock data for the last 30 days
  const generateMockData = () => {
    const dates = [];
    const summariesData = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Generate random but realistic usage data
      summariesData.push(Math.floor(Math.random() * 10) + Math.floor(Math.cos(i / 7) * 3) + 3);
    }
    
    return { dates, summariesData };
  };

  const { dates, summariesData } = generateMockData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 200,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          lineWidth: 1,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxTicksLimit: 10,
          font: {
            size: 11
          }
        },
        border: {
          display: false
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Number of Summaries Generated',
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          lineWidth: 1,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          beginAtZero: true,
          font: {
            size: 11
          }
        },
        border: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(255, 107, 53, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        intersect: false,
        mode: 'index',
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          title: function(context) {
            return `Date: ${context[0].label}`;
          },
          label: function(context) {
            return `Summaries Generated: ${context.parsed.y}`;
          }
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 3
      },
      line: {
        borderWidth: 3,
        tension: 0.4
      }
    }
  };

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: 'Summaries',
        data: summariesData,
        borderColor: '#ff6b35',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        pointBorderColor: '#ff6b35',
        pointBackgroundColor: '#ff6b35',
        pointHoverBackgroundColor: '#ff6b35',
        pointHoverBorderColor: '#ffffff',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3
      }
    ]
  };

  const totalSummaries = summariesData.reduce((a, b) => a + b, 0);
  const avgSummaries = Math.round(totalSummaries / summariesData.length);

  return (
    <div className="single-chart-container summaries-chart">
      <div className="chart-header">
        <h3 style={{ color: '#ff6b35', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
          Summary Generation
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', margin: 0 }}>
          Track your summary generation over the last 30 days
        </p>
      </div>
      
      <div className="chart-container">
        <Line 
          data={chartData} 
          options={chartOptions}
        />
      </div>
      
      <div className="chart-stats" style={{ justifyContent: 'space-around', marginTop: '1rem' }}>
        <div className="stat-item">
          <div className="stat-color summaries-color"></div>
          <span className="stat-label">Total: </span>
          <span className="stat-value">{totalSummaries}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Daily Avg: </span>
          <span className="stat-value">{avgSummaries}</span>
        </div>
      </div>
    </div>
  );
};

export default SummariesChart;
