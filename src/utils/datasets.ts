import outdoorHeatExposureIndex from "/icons/outdoor_heat_exposure_index.svg";
import weatherStations from "/icons/weather_stations.svg";
import airTemperature from "/icons/air_temperature.svg";
import airHeatIndex from "/icons/air_heat_index.svg";
import meanRadiantTemperature from "/icons/mean_radiant_temperature.svg";
import surfaceTemperature from "/icons/surface_temperature.svg";
import treeCanopy from "/icons/tree_canopy.svg";
import coolRoofs from "/icons/cool_roofs.svg";
import premeableSurface from "/icons/permeable_surface.svg";
import parks from "/icons/parks.svg";

import mapboxgl, { Map } from "mapbox-gl";
import { cachedFetch } from "./cache";
import { viewSurfaceTemperature } from "./viewSurfaceTemperature";
import { createNtaLayer } from "./viewGenericNTA";
import { API_KEY, BASE_URL, fetchStationHeatStats } from "./api";
import { viewTreeCanopy } from "./viewTreeCanopy";
import { viewWeatherStations } from "./viewWeatherStations";
import { nta_dataset_info } from "../App";
import { viewMRT } from "./viewMRT";
import { viewCoolRoofs } from "./viewCoolRoofs";
import { viewPremeableSurface } from "./viewPremeableSurface";

type IconType = typeof outdoorHeatExposureIndex;

export interface ViewOptions {
  date?: string;
  year?: number;
}

export interface LegendItem {
  label: string;
  value: string;
}

export interface View {
  name: string;
  legend?: LegendItem[];
  init?: (map: Map, options?: ViewOptions) => () => void;
}

interface CollectionOfViews {
  [key: string]: View;
}

export interface DownloadUrl {
  name: string;
  url: string;
  date?: string; // in YYYY or YYYYMMDD
  format: string;
}

export interface Dataset {
  name: string;
  group: string;
  icon: IconType;
  info?: string;
  externalSource?: string;
  externalUrl?: string; // direct to the landing page of the external resource we don't own
  // in some cases we need to look up the csv, generate a custom urls to the supabase, or call an api to get the links
  getDownloadUrls?: (options?: any) => Promise<DownloadUrl[]>;

  currentView: null | string;
  dates?: string[];
  currentDate?: null | string;
  getDates?: () => Promise<string[]>;
  years?: number[];
  currentYear?: null | number;
  getYears?: () => Promise<number[]>;
  views: CollectionOfViews;
}

export const datasets: Dataset[] = [
  {
    name: "Outdoor Heat Exposure Index",
    group: "",
    icon: outdoorHeatExposureIndex,
    info: "The Outdoor Heat Exposure Index is a measure of the risk of heat-related illnesses for people spending time outdoors.",
    currentView: "nta",
    views: {
      nta: {
        name: "NTA Aggregated",
        legend: [
          { label: "1", value: "#faebc5" },
          { label: "2", value: "#e8a98b" },
          { label: "3", value: "#d66852" },
          { label: "4", value: "#943d33" },
          { label: "5", value: "#511314" },
        ],
        init: function (map) {
          return createNtaLayer(
            map,
            "HEAT_VULNERABILITY",
            this.name,
            this.legend!,
            {
              "fill-color": [
                "interpolate",
                ["linear"],
                ["get", "HEAT_VULNERABILITY"],
                1,
                "#faebc5",
                2,
                "#e8a98b",
                3,
                "#d66852",
                4,
                "#943d33",
                5,
                "#511314",
              ],
            }
          );
        },
      },
    },
  },
  {
    name: "Weather Stations",
    group: "",
    icon: weatherStations,
    currentView: null,
    getYears: async (): Promise<number[]> => {
      const data = await fetchStationHeatStats();
      const years = data.features.map((d: any) => d.properties.year);
      const uniqueYears = [...new Set(years)];
      return uniqueYears as number[];
    },
    years: [],
    currentYear: 2023,
    views: {
      points: {
        name: "Raw Data",
        init: (map, options) => viewWeatherStations(map, options?.year!),
      },
    },
  },
  {
    name: "Mean Radiant Temperature",
    group: "Static Factors",
    icon: meanRadiantTemperature,
    currentView: null,
    views: {
      nta: {
        name: "NTA Aggregated",
        legend: [
          { label: "3%", value: "#f1dfd9" },
          { label: "18%", value: "#e3c0b2" },
          { label: "33%", value: "#d4a08c" },
          { label: "48%", value: "#c68165" },
          { label: "63%", value: "#b8613f" },
        ],
        init: function (map) {
          return createNtaLayer(
            map,
            "NTA_PCT_MRT_Less_Than_110",
            this.name,
            this.legend!,
            {
              "fill-color": [
                "case",
                ["<=", ["get", "NTA_PCT_MRT_Less_Than_110"], 3],
                "#f1dfd9",
                ["<=", ["get", "NTA_PCT_MRT_Less_Than_110"], 18],
                "#e3c0b2",
                ["<=", ["get", "NTA_PCT_MRT_Less_Than_110"], 33],
                "#d4a08c",
                ["<=", ["get", "NTA_PCT_MRT_Less_Than_110"], 48],
                "#c68165",
                ["<=", ["get", "NTA_PCT_MRT_Less_Than_110"], 63],
                "#b8613f",
                "#000000", // Default color if no match
              ],
            }
          );
        },
      },
      raw: {
        name: "Raw Data",
        init: function (map) {
          const MRTCleanup = viewMRT(map);
          const ntaLayerCleanup = createNtaLayer(
            map,
            "NTA_PCT_MRT_Less_Than_110",
            this.name,
            this.legend!
          );
          return function onDestroy() {
            ntaLayerCleanup();
            MRTCleanup();
          };
        },
      },
    },
  },
  {
    name: "Surface Temperature",
    group: "Static Factors",
    icon: surfaceTemperature,
    info: `Surface Temperature indicates how hot the "surface" of the Earth would feel to the touch in a particular location (i.e. building roofs, grass, tree canopy, etc.). Surface temperature is not the same as the air temperature in the daily weather report.`,
    currentView: null,
    dates: [],
    currentDate: null,
    getDownloadUrls: async () => {
      const urls = nta_dataset_info.value
        .filter((dataset) => dataset.type === "surface_temp")
        .reduce((urls: DownloadUrl[], dataset: any) => {
          // todo: setup csv in a better format
          const raw_url = dataset.downloads;
          const relative_url = dataset.downloads_2;
          return [
            ...urls,
            { name: "Raw", url: raw_url, date: dataset.date, format: "raw" },
            {
              name: "Relative",
              url: relative_url,
              date: dataset.date,
              format: "relative",
            },
          ];
        }, []);

      return urls;
    },
    getDates: async () => {
      return nta_dataset_info.value
        .filter((dataset) => dataset.type === "surface_temp")
        .map((d: any) => d.date)
        .sort();
    },
    views: {
      nta: {
        name: "NTA Aggregated",
        legend: [
          { label: "92.1", value: "#f4e0d7" },
          { label: "93.3", value: "#cbada6" },
          { label: "94.4", value: "#a37a76" },
          { label: "95.7", value: "#7a4645" },
          { label: "98.8", value: "#511314" },
        ],
        init: function (map, options) {
          const date = `ST_${options?.date || "20230902"}`;
          return createNtaLayer(map, date, this.name, this.legend!, {
            "fill-color": [
              "case",
              ["<=", ["get", date], 92.1],
              "#f4e0d7",
              ["<=", ["get", date], 93.3],
              "#cbada6",
              ["<=", ["get", date], 94.4],
              "#a37a76",
              ["<=", ["get", date], 95.7],
              "#7a4645",
              ["<=", ["get", date], 98.8],
              "#511314",
              "#000000", // Default color if no match
            ],
          });
        },
      },
      raw: {
        name: "Raw Data",
        init: function (map, options) {
          const date = `ST_${options?.date || "20230731"}`;
          const surfaceTemperatureCleanup = viewSurfaceTemperature(
            map,
            options?.date
          );
          const ntaLayerCleanup = createNtaLayer(
            map,
            date,
            this.name,
            this.legend!
          );

          return function onDestroy() {
            ntaLayerCleanup();
            surfaceTemperatureCleanup();
          };
        },
      },
    },
  },
  {
    name: "Tree Canopy",
    group: "Static Factors",
    icon: treeCanopy,
    info: "Urban tree canopy (UTC) shows areas where leaves, branches, and stems of trees cover the ground, when viewed from above. UTC reduces the urban heat island effect, reduces heating/cooling costs, lowers air temperatures, reduces air pollution.",
    currentView: null,
    views: {
      nta: {
        name: "NTA Aggregated",
        legend: [
          { label: "10%", value: "#d6dfe1" },
          { label: "20%", value: "#adbec3" },
          { label: "30%", value: "#859ea4" },
          { label: "40%", value: "#5c7d86" },
          { label: "50%", value: "#335d68" },
        ],
        init: function (map) {
          return createNtaLayer(map, "PCT_TREES", this.name, this.legend!, {
            "fill-color": [
              "case",
              ["<=", ["get", "PCT_TREES"], 10],
              "#d6dfe1",
              ["<=", ["get", "PCT_TREES"], 20],
              "#adbec3",
              ["<=", ["get", "PCT_TREES"], 30],
              "#859ea4",
              ["<=", ["get", "PCT_TREES"], 40],
              "#5c7d86",
              ["<=", ["get", "PCT_TREES"], 50],
              "#335d68",
              "#000000", // Default color if no match
            ],
          });
        },
      },
      raw: {
        name: "Raw Data",
        init: function (map) {
          const ntaLayerCleanup = createNtaLayer(
            map,
            "PCT_TREES",
            this.name,
            this.legend!
          );
          const treeCanopyCleanup = viewTreeCanopy(map);
          return function onDestroy() {
            ntaLayerCleanup();
            treeCanopyCleanup();
          };
        },
      },
    },
  },
  {
    name: "Cool Roofs",
    group: "Static Factors",
    icon: coolRoofs,
    info: "Cool roofs absorb and transfer less heat from the sun to the building compared with a more conventional roof. Buildings with cool roofs use less air conditioning, save energy, and have more comfortable indoor temperatures. Cool roofs also impact surrounding areas by lowering temperatures outside of buildings and thus mitigating the heat island effect.",
    currentView: null,
    views: {
      nta: {
        name: "NTA Aggregated",
        legend: [
          { label: "3%", value: "#d3d5d9" },
          { label: "21%", value: "#a6abb3" },
          { label: "39%", value: "#7a818c" },
          { label: "58%", value: "#4d5766" },
          { label: "77%", value: "#212d40" },
        ],
        init: function (map) {
          return createNtaLayer(
            map,
            "PCT_AREA_COOLROOF",
            this.name,
            this.legend!,
            {
              "fill-color": [
                "case",
                ["<=", ["get", "PCT_AREA_COOLROOF"], 3],
                "#d3d5d9",
                ["<=", ["get", "PCT_AREA_COOLROOF"], 21],
                "#a6abb3",
                ["<=", ["get", "PCT_AREA_COOLROOF"], 39],
                "#7a818c",
                ["<=", ["get", "PCT_AREA_COOLROOF"], 58],
                "#4d5766",
                ["<=", ["get", "PCT_AREA_COOLROOF"], 77],
                "#212d40",
                "#000000", // Default color if no match
              ],
            }
          );
        },
      },
      raw: {
        name: "Raw Data",
        init: function (map) {
          // const ntaLayerCleanup = createNtaLayer(
          //   map,
          //   "PCT_AREA_COOLROOF",
          //   this.name,
          //   this.legend!
          // );
          const coolRoofsCleanup = viewCoolRoofs(map);
          return function onDestroy() {
            // ntaLayerCleanup();
            coolRoofsCleanup();
          };
        },
      },
    },
  },
  {
    name: "Permeable Surfaces",
    group: "Static Factors",
    icon: premeableSurface,
    currentView: null,
    views: {
      nta: {
        name: "NTA Aggregated",
        legend: [
          { label: "10%", value: "#f3d9b1" },
          { label: "20%", value: "#dabb8b" },
          { label: "30%", value: "#c19d65" },
          { label: "40%", value: "#a87e3e" },
          { label: "71%", value: "#8f6018" },
        ],
        init: function (map) {
          return createNtaLayer(map, "PCT_PERMEABLE", this.name, this.legend!, {
           "fill-color": [
                "case",
                ["<=", ["get", "PCT_PERMEABLE"], 10],
                "#f3d9b1",
                ["<=", ["get", "PCT_PERMEABLE"], 20],
                "#dabb8b",
                ["<=", ["get", "PCT_PERMEABLE"], 30],
                "#c19d65",
                ["<=", ["get", "PCT_PERMEABLE"], 40],
                "#a87e3e",
                ["<=", ["get", "PCT_PERMEABLE"], 71],
                "#8f6018",
                "#000000", // Default color if no match
              ],
          });
        },
      },
      raw: {
        name: "Raw Data",
        legend: [],
        init: (map) => viewPremeableSurface(map),
      },
    },
  },
  {
    name: "Air Temperature",
    group: "Dynamic Factors",
    icon: airTemperature,
    info: "Air temperature is a measure of how hot or cold the air is. It is the most commonly measured weather parameter.",
    currentView: null,
    views: {
      nta: { name: "NTA Aggregated" },
      raw: { name: "Raw Data" },
    },
  },
  {
    name: "Air Heat Index",
    group: "Dynamic Factors",
    icon: airHeatIndex,
    info: "Air Heat Index is what the temperature feels like to the human body when relative humidity is combined with the air temperature.  This has important considerations for the human body's comfort.",
    currentView: null,
    views: {
      nta: { name: "NTA Aggregated" },
      raw: { name: "Raw Data" },
    },
  },

  // {
  //   name: "Parks",
  //   group: "Heat Mitigation",
  //   icon: parks,
  //   currentView: null,
  //   views: {
  //     nta: {
  //       name: "NTA Aggregated",
  //       legend: [
  //         { label: 6144, value: "#d4dfda" },
  //         { label: 4662, value: "#a9bfb5" },
  //         { label: 3182, value: "#7e9f91" },
  //         { label: 1702, value: "#537e6c" },
  //         { label: 222, value: "#295f48" },
  //       ],
  //       init: function (map) {
  //         return createNtaLayer(map, "AVG_DIST_TO_PARKS_FT", this.name, {
  //           "fill-color": [
  //             "interpolate",
  //             ["linear"],
  //             ["get", "AVG_DIST_TO_PARKS_FT"],
  //             222,
  //             "#295f48",
  //             6144,
  //             "#d4dfda",
  //           ],
  //         });
  //       },
  //     },
  //     raw: { name: "Raw Data" },
  //   },
  // },
];

let destroyCallback: (() => void) | null = null;

export async function initializeView(
  dataset: Dataset,
  map: mapboxgl.Map | null
) {


  if (!dataset.currentView || !map) return dataset;


  // remove the previous view
  try {
    if (destroyCallback) destroyCallback();
  } catch (error) {
    destroyCallback = null;
  }

  const view = dataset.views[dataset.currentView];

  if (view.init) {
    const options: ViewOptions = {};

    if (dataset.getDates) {
      dataset.dates = await dataset.getDates();
      if (!dataset.currentDate) {
        dataset.currentDate = dataset.dates.at(-1);
      }
      options.date = dataset.currentDate;
    }

    if (dataset.getYears) {
      dataset.years = await dataset.getYears();
      if (!dataset.currentYear) {
        dataset.currentYear = dataset.years.at(-1);
      }
      options.year = dataset.currentYear;
    }

    destroyCallback = view.init(map, options);
  } else {
    console.error(
      `${dataset.name}, ${dataset.currentView} doesn't have an init func`
    );
    destroyCallback = null;
  }

  return dataset;
}
