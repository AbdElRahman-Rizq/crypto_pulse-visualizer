import { useEffect } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';
import am5geodata_worldLow from '@amcharts/amcharts5-geodata/worldLow';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';
import * as am5exporting from '@amcharts/amcharts5/plugins/exporting';

function CryptoMap() {
  useEffect(() => {
    const root = am5.Root.new('mapdiv');
    root.setThemes([
      am5themes_Animated.new(root),
      am5themes_Dark.new(root),
    ]);

    const mapChart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: 'rotateX',
        panY: 'rotateY',
        projection: am5map.geoMercator(),
      })
    );

    const polygonSeries = mapChart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow,
        exclude: ['AQ'],
      })
    );

    polygonSeries.mapPolygons.template.setAll({
      tooltipText: '{name}',
      fill: am5.color(0x2a2f3a),
      stroke: am5.color(0x0b0f19),
      strokeWidth: 0.5,
    });

    polygonSeries.mapPolygons.template.states.create('hover', {
      fill: am5.color(0x00e5ff),
    });

    am5exporting.Exporting.new(root, {
      menu: am5exporting.ExportingMenu.new(root, {}),
      filePrefix: 'CryptoPulse_Map',
    });

    return () => {
      root.dispose();
    };
  }, []);

  return <div id="mapdiv" className="chart-box" />;
}

export default CryptoMap;
