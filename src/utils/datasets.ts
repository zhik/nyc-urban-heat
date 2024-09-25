import outdoorHeatExposureIndex from "/icons/outdoor_heat_exposure_index.svg"
import weatherStations from "/icons/weather_stations.svg"
import airTemperature from "/icons/air_temperature.svg"
import airHeatIndex from "/icons/air_heat_index.svg"
import meanRadiantTemperature from "/icons/mean_radiant_temperature.svg"
import surfaceTemperature from "/icons/surface_temperature.svg"
import treeCanopy from "/icons/tree_canopy.svg"
import coolRoofs from "/icons/cool_roofs.svg"
import premeableSurface from "/icons/permeable_surface.svg"
import parks from "/icons/parks.svg"

import mapboxgl, { Map } from "mapbox-gl"
import { cachedFetch } from "./cache"
import { viewSurfaceTemperature } from "./viewSurfaceTemperature"
import { createNtaLayer } from "./viewGenericNTA"
import { API_KEY, BASE_URL } from "./api"

type IconType = typeof outdoorHeatExposureIndex;

export interface ViewOptions {
  date?: string
}

export interface LegendItem {
  label: string | number,
  value: string
}

export interface View {
  name: string;
  legend?: LegendItem[];
  init?: (map: Map, options?: ViewOptions) => () => void;
}

interface CollectionOfViews {
  [key: string]: View;
}

export interface Dataset {
  name: string;
  group: string;
  icon: IconType;
  info?: string;
  currentView: null | string;
  dates?: string[];
  currentDate?: null | string;
  getDates?: () => Promise<string[]>;
  views: CollectionOfViews;
}

export const datasets: Dataset[] = [
  {
    name: "Outdoor Heat Exposure Index",
    group: "",
    icon: outdoorHeatExposureIndex,
    info: "The Outdoor Heat Exposure Index is a measure of the risk of heat-related illnesses for people spending time outdoors.",
    currentView: null,
    views: {
      'nta': {
        name: 'NTA Aggregated',
        legend: [
          { label: 1, value: '#f1c490' }, 
          { label: 2, value: '#e39671' }, 
          { label: 3, value: '#d66852' }, 
          { label: 4, value: '#933d33' },
          { label: 5, value: '#511314' }],
        init: function (map) {
          return createNtaLayer(map, 'HEAT_VULNERABILITY', this.name, {
            'fill-color': [
              "interpolate",
              ["linear"],
              ["get", "HEAT_VULNERABILITY"],
              0,
              "#FFF3B0",
              3,
              "#D66852",
              5,
              "#511314"
            ],

          })
        }
      }
    }
  },
  {
    name: "Weather Stations",
    group: "",
    icon: weatherStations,
    currentView: null,
    views: {
      'points': { name: 'Stations' }
    }
  },
  {
    name: "Air Temperature",
    group: "Outdoor Heat Exposure",
    icon: airTemperature,
    currentView: null,
    views: {
      'nta': { name: 'NTA Aggregated' },
      'raw': { name: 'Raw Data' }
    }
  },
  {
    name: "Air Heat Index",
    group: "Outdoor Heat Exposure",
    icon: airHeatIndex,
    currentView: null,
    views: {
      'nta': { name: 'NTA Aggregated' },
      'raw': { name: 'Raw Data' }
    }
  },
  {
    name: "Mean Radiant Temperature",
    group: "Outdoor Heat Exposure",
    icon: meanRadiantTemperature,
    currentView: null,
    views: {
      'nta': { name: 'NTA Aggregated' },
      'raw': { name: 'Raw Data' }
    }
  },
  {
    name: "Surface Temperature",
    group: "Outdoor Heat Exposure",
    icon: surfaceTemperature,
    currentView: null,
    dates: [],
    currentDate: null,
    getDates: async () => {
      return (await cachedFetch(`${BASE_URL}nta_metrics?select=date&type=eq.surface_temp&apikey=${API_KEY}`)).map((d: any) => d.date).sort()
    },
    views: {
      'nta': { name: 'NTA Aggregated' },
      'raw': { name: 'Raw Data', init: (map, options) => viewSurfaceTemperature(map, options?.date) }
    }
  },
  {
    name: "Tree Canopy",
    group: "Heat Mitigation",
    icon: treeCanopy,
    currentView: null,
    views: {
      'nta': { name: 'NTA Aggregated' },
      'raw': { name: 'Raw Data' }
    }
  },
  {
    name: "Cool Roofs",
    group: "Heat Mitigation",
    icon: coolRoofs,
    currentView: null,
    views: {
      'nta': { name: 'NTA Aggregated' },
      'raw': { name: 'Raw Data' }
    }
  },
  {
    name: "Premeable Surfaces",
    group: "Heat Mitigation",
    icon: premeableSurface,
    currentView: null,
    views: {
      'nta': { name: 'NTA Aggregated' },
      'raw': { name: 'Raw Data' }
    }
  },
  {
    name: "Parks",
    group: "Heat Mitigation",
    icon: parks,
    currentView: null,
    views: {
      'nta': { name: 'NTA Aggregated' },
      'raw': { name: 'Raw Data' }
    }
  }
];

let destroyCallback: (() => void) | null = null

export async function initializeView(dataset: Dataset, map: mapboxgl.Map | null) {
  // fail states
  if (!dataset.currentView || !map) return dataset

  // remove the previous view
  try {
    if (destroyCallback) destroyCallback()
  } catch (error) {
    destroyCallback = null
  }

  const view = dataset.views[dataset.currentView]
  if (view.init) {
    console.log(`init ${dataset.name}, ${dataset.currentView}`)
    const options: ViewOptions = {}

    // set up dates for the dataset
    if (dataset.getDates) {
      dataset.dates = await dataset.getDates()
      // set the first option, if there is no currentDate
      if (!dataset.currentDate) {
        dataset.currentDate = dataset.dates.at(-1)
      }
      options.date = dataset.currentDate
    }

    destroyCallback = view.init(map, options);
  } else {
    console.error(`${dataset.name}, ${dataset.currentView} doesn't have an init func`)
    destroyCallback = null
  }

  return dataset
}