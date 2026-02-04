import { useEffect, useRef, useState } from 'react';
import './App.css';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';
import * as am5exporting from '@amcharts/amcharts5/plugins/exporting';
import CryptoMap from './components/CryptoMap';

function App() {
  const [currency, setCurrency] = useState('usd');
  const [loading, setLoading] = useState(true);
  const [supportedCurrencies, setSupportedCurrencies] = useState([
    'usd',
    'eur',
    'egp',
    'gbp',
  ]);
  const chartDivRef = useRef(null);
  const lineRootRef = useRef(null);

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/supported_vs_currencies')
      .then((response) => response.json())
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setSupportedCurrencies(list);
          if (!list.includes(currency)) {
            setCurrency(list[0]);
          }
        }
      })
      .catch((error) => {
        console.error('Error fetching currencies', error);
      });
  }, []);

  useEffect(() => {
    const container = chartDivRef.current;
    if (!container) {
      return undefined;
    }

    if (lineRootRef.current) {
      lineRootRef.current.dispose();
      lineRootRef.current = null;
    }

    const lineRoot = am5.Root.new(container);
    lineRootRef.current = lineRoot;
    lineRoot.setThemes([
      am5themes_Animated.new(lineRoot),
      am5themes_Dark.new(lineRoot),
    ]);

    const chart = lineRoot.container.children.push(
      am5xy.XYChart.new(lineRoot, {
        panX: true,
        panY: false,
        wheelX: 'panX',
        wheelY: 'zoomX',
        layout: lineRoot.verticalLayout,
      })
    );

    const xRenderer = am5xy.AxisRendererX.new(lineRoot, {
      minGridDistance: 60,
    });

    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(lineRoot, {
        maxDeviation: 0.2,
        baseInterval: { timeUnit: 'day', count: 1 },
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(lineRoot, {}),
      })
    );

    xRenderer.labels.template.setAll({
      minPosition: 0.01,
      maxPosition: 0.99,
    });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(lineRoot, {
        renderer: am5xy.AxisRendererY.new(lineRoot, {}),
      })
    );

    const tooltip = am5.Tooltip.new(lineRoot, {
      labelText: `[bold]{valueY}[/] ${currency.toUpperCase()}`,
    });
    const tooltipLabel = tooltip.get('label');
    if (tooltipLabel) {
      tooltipLabel.setAll({ fill: am5.color(0xfff5c3) });
    }

    const series = chart.series.push(
      am5xy.LineSeries.new(lineRoot, {
        name: 'BTC',
        xAxis,
        yAxis,
        valueYField: 'value',
        valueXField: 'date',
        stroke: am5.color(0x00e5ff),
        fill: am5.color(0x00e5ff),
        tooltip,
      })
    );

    series.strokes.template.setAll({ strokeWidth: 2 });
    chart.set('cursor', am5xy.XYCursor.new(lineRoot, { xAxis }));

    am5exporting.Exporting.new(lineRoot, {
      menu: am5exporting.ExportingMenu.new(lineRoot, {}),
      filePrefix: 'CryptoPulse_Data',
    });

    setLoading(true);

    fetch(
      `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${currency}&days=7`
    )
      .then((response) => response.json())
      .then((data) => {
        const points = data.prices.map(([date, value]) => ({
          date,
          value,
        }));
        series.data.setAll(points);
        setLoading(false);
      })
      .catch(() => {
        series.data.setAll([]);
        setLoading(false);
      });

    return () => {
      lineRoot.dispose();
      lineRootRef.current = null;
    };
  }, [currency]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-title">
          <h1>CryptoPulse Visualizer</h1>
          <p>30-day Bitcoin trend + global crypto activity canvas.</p>
        </div>
        <div className="controls">
          <label htmlFor="currency-select">Select Currency:</label>
          <div className="select-wrapper">
            <select
              id="currency-select"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            >
              {supportedCurrencies.map((code) => (
                <option key={code} value={code}>
                  {code.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      <main className="App-content">
        <div className="dashboard-grid">
          <section className="chart-card">
            <h2>Bitcoin Price ({currency.toUpperCase()})</h2>
            <div className="chart-stage">
              {loading && <div className="loader">Loading Pulse Data...</div>}
              <div id="chartdiv" ref={chartDivRef} className="chart-box" />
            </div>
          </section>
          <section className="chart-card">
            <h2>Global Snapshot</h2>
            <small className="map-hint">* Interactive world view of crypto markets.</small>
            <CryptoMap />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
