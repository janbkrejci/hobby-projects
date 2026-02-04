"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
);

type FloodRecord = {
  datetime: Date;
  waterHeight: number;
};

const API_URL = "/api/flood-scraper";
const DEFAULT_CHART_COLORS = {
  stroke: "hsl(180 60% 40%)",
  fill: "hsl(215 80% 30% / 0.35)",
  grid: "hsl(220 10% 70% / 0.2)",
  text: "currentColor",
};

function parseDate(dateString: string) {
  const trimmed = dateString.trim();
  const dateTimePattern = /(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{1,2})/;
  const match = trimmed.match(dateTimePattern);

  if (match) {
    const [, day, month, year, hours, minutes] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
    );
  }

  const dateParts = trimmed.split(/[\s.:/]+/);
  if (dateParts.length >= 5) {
    return new Date(
      Number(dateParts[2]),
      Number(dateParts[1]) - 1,
      Number(dateParts[0]),
      Number(dateParts[3]),
      Number(dateParts[4]),
    );
  }

  return new Date(0);
}

async function fetchData(): Promise<FloodRecord[]> {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    let dataTable: HTMLTableElement | null = null;

    const tborderDivs = doc.querySelectorAll("div.tborder.center_text");
    if (tborderDivs.length > 0) {
      const tables = tborderDivs[0].querySelectorAll("table");
      if (tables.length > 0) {
        dataTable = tables[0] as HTMLTableElement;
      }
    }

    if (!dataTable) {
      const tables = Array.from(doc.querySelectorAll("table"));
      for (const table of tables) {
        const headers = table.querySelectorAll("th");
        let hasDateHeader = false;
        let hasWaterLevelHeader = false;
        let hasFlowHeader = false;

        for (const header of headers) {
          const headerText = header.textContent?.trim().toLowerCase() ?? "";
          if (headerText.includes("datum a čas")) {
            hasDateHeader = true;
          }
          if (headerText.includes("stav [cm]")) {
            hasWaterLevelHeader = true;
          }
          if (headerText.includes("průtok")) {
            hasFlowHeader = true;
          }
        }

        if (hasDateHeader && hasWaterLevelHeader && hasFlowHeader) {
          dataTable = table as HTMLTableElement;
          break;
        }
      }
    }

    if (!dataTable) {
      const tables = Array.from(doc.querySelectorAll("table"));
      for (const table of tables) {
        const rows = table.querySelectorAll("tr");
        if (rows.length < 5) continue;

        let validRows = 0;

        for (let i = 1; i < Math.min(rows.length, 5); i += 1) {
          const cells = rows[i].querySelectorAll("td");
          if (cells.length >= 3) {
            const dateText = cells[0].textContent?.trim() ?? "";
            if (/\d{2}\.\d{2}\.\d{4}/.test(dateText)) {
              validRows += 1;
            }
          }
        }

        if (validRows >= 3) {
          dataTable = table as HTMLTableElement;
          break;
        }
      }
    }

    if (!dataTable) {
      return [];
    }

    const rows = dataTable.querySelectorAll("tr");
    const result: FloodRecord[] = [];

    let startIndex = 0;
    const firstRowCells = rows[0]?.querySelectorAll("th") ?? [];
    if (firstRowCells.length > 0) {
      startIndex = 1;
    }

    for (let i = startIndex; i < rows.length; i += 1) {
      const cells = rows[i].querySelectorAll("td");
      if (cells.length >= 3) {
        const dateText = cells[0].innerText.trim();
        const waterHeightText = cells[1].innerText.trim();

        if (
          !/\d{2}\.\d{2}\.\d{4}/.test(dateText) &&
          !/\d{1,2}\.\d{1,2}\.\d{4}/.test(dateText)
        ) {
          continue;
        }

        if (dateText && waterHeightText) {
          const datetime = parseDate(dateText);
          const cleanedHeightText = waterHeightText
            .replace(/[^\d.,]/g, "")
            .replace(",", ".");
          const waterHeight = Number.parseFloat(cleanedHeightText);

          if (!Number.isNaN(waterHeight) && !Number.isNaN(datetime.valueOf())) {
            result.push({ datetime, waterHeight });
          }
        }
      }
    }

    result.sort((a, b) => b.datetime.valueOf() - a.datetime.valueOf());

    return result;
  } catch {
    return [];
  }
}

export default function FloodScraperPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<"line"> | null>(null);
  const [status, setStatus] = useState("Načítám data o hladině Výrovky...");
  const [lastRecord, setLastRecord] = useState<FloodRecord | null>(null);
  const [chartColors, setChartColors] = useState(DEFAULT_CHART_COLORS);

  const lastRecordLabel = useMemo(() => {
    if (!lastRecord) return "";
    return `Hladina Výrovky v Plaňanech. Poslední záznam: ${lastRecord.datetime.toLocaleString(
      "cs-CZ",
    )} - ${lastRecord.waterHeight} cm`;
  }, [lastRecord]);

  useEffect(() => {
    const withAlpha = (color: string, alpha: number) => {
      if (!color) return "";
      const probe = document.createElement("div");
      probe.style.color = color;
      document.body.appendChild(probe);
      const computed = getComputedStyle(probe).color;
      document.body.removeChild(probe);

      const match = computed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
      if (!match) return color;
      const [, r, g, b] = match;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const readColors = () => {
      const rootStyles = getComputedStyle(document.documentElement);
      const stroke = "#1f6feb";
      const grid = rootStyles.getPropertyValue("--border").trim();
      const text = rootStyles.getPropertyValue("--foreground").trim();

      const fallback = DEFAULT_CHART_COLORS;
      return {
        stroke: stroke || fallback.stroke,
        fill: withAlpha(stroke || fallback.stroke, 0.3) || fallback.fill,
        grid: withAlpha(grid || fallback.grid, 0.15) || fallback.grid,
        text: text || fallback.text,
      };
    };

    setChartColors(readColors());

    const observer = new MutationObserver(() => {
      setChartColors(readColors());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Hladina vody (cm)",
            data: [],
            borderColor: DEFAULT_CHART_COLORS.stroke,
            borderWidth: 2,
            pointRadius: 1,
            pointHoverRadius: 5,
            fill: true,
            backgroundColor: DEFAULT_CHART_COLORS.fill,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: DEFAULT_CHART_COLORS.text,
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              title: (items) => items[0]?.label ?? "",
              label: (context) => `${context.parsed.y} cm`,
            },
          },
        },
        scales: {
          x: {
            type: "category",
            grid: {
              color: DEFAULT_CHART_COLORS.grid,
            },
            ticks: {
              color: DEFAULT_CHART_COLORS.text,
              maxRotation: 0,
              autoSkip: true,
            },
          },
          y: {
            beginAtZero: false,
            ticks: {
              color: DEFAULT_CHART_COLORS.text,
              callback: (value) => `${value} cm`,
            },
            grid: {
              color: DEFAULT_CHART_COLORS.grid,
            },
          },
        },
      },
    });

    chartRef.current = chart;

    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const dataset = chart.data.datasets[0];
    dataset.borderColor = chartColors.stroke;
    dataset.backgroundColor = chartColors.fill;
    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = chartColors.text;
    }
    if (chart.options.scales?.x?.ticks) {
      chart.options.scales.x.ticks.color = chartColors.text;
    }
    if (chart.options.scales?.y?.ticks) {
      chart.options.scales.y.ticks.color = chartColors.text;
    }
    if (chart.options.scales?.x?.grid) {
      chart.options.scales.x.grid.color = chartColors.grid;
    }
    if (chart.options.scales?.y?.grid) {
      chart.options.scales.y.grid.color = chartColors.grid;
    }
    chart.update();
  }, [chartColors]);

  useEffect(() => {
    let isMounted = true;

    async function fetchAndUpdate() {
      const data = await fetchData();
      if (!isMounted) return;

      if (data.length === 0) {
        setStatus("Nepodařilo se načíst data o hladině Výrovky");
        return;
      }

      const newestRecord = data[0];
      setLastRecord(newestRecord);
      setStatus("");

      const chart = chartRef.current;
      if (!chart) return;

      const ordered = data.slice().reverse();
      const labels = ordered.map((entry) =>
        entry.datetime.toLocaleString("cs-CZ"),
      );
      const values = ordered.map((entry) => entry.waterHeight);

      const minValue = Math.min(...values) - 5;
      const maxValue = Math.max(...values) + 5;

      chart.data.labels = labels;
      chart.data.datasets[0].data = values;
      chart.options.scales = {
        ...chart.options.scales,
        y: {
          ...(chart.options.scales?.y ?? {}),
          min: minValue,
          max: maxValue,
        },
      };
      chart.update();
    }

    fetchAndUpdate();
    const interval = window.setInterval(fetchAndUpdate, 300000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <main className="flex w-full max-w-6xl flex-col items-center px-6 py-12">
        <h1 className="text-2xl font-semibold">Hladina Výrovky</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {status || lastRecordLabel}
        </p>
        <div className="mt-6 h-[70vh] w-full max-w-5xl rounded-2xl border border-border bg-card p-3 shadow-sm">
          <canvas ref={canvasRef} className="h-full w-full" />
        </div>
      </main>
    </div>
  );
}
