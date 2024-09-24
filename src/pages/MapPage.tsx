import { useEffect, useRef } from 'react'
import mapboxgl, { MapboxGeoJSONFeature, LngLatLike } from "mapbox-gl"

import useOutdoorHeatExposureNTALayer from '../hooks/useOutdoorHeatExposureNTALayer.js'
import useSurfaceTemperatureLayer from '../hooks/useSurfaceTemperatureLayer.js';
import useWeatherStationLayer from '../hooks/useWeatherStationsLayer.js';
import useTreeCanopyLayer from '../hooks/useTreeCanopyLayer.js';
import useNTALayer from '../hooks/useNTALayer.js'


import Nav from "../components/Nav"
import DatasetDownloadPopup from '../components/DatasetDownloadPopup.js'
import NeighborhoodProfile from '../components/NeighborhoodProfile.js';
import DatasetSelections from '../components/DatasetSelections.js';
import MapDateSelections from '../components/MapDateSelections.js';
import WeatherStationProfile from '../components/WeatherStationProfile.js';
import Legends from '../components/Legends.js';
import { NtaProfileData } from '../types.js'
import "./Map.css"
import { signal } from '@preact/signals-react'
import { Dataset, View } from '../utils/datasets.js';


export const map = signal<mapboxgl.Map | null>(null)
export const selectedDataset = signal<Dataset | null>(null)
export const isProfileExpanded = signal(false)


const MapPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  
  const defaultCoordinates: LngLatLike | undefined = [-73.913, 40.763]
  const defaultZoom = 11

  useEffect(() => {
    // init map
    if (!mapContainer.current) return;

    mapboxgl.accessToken = "pk.eyJ1IjoiY2xvdWRsdW4iLCJhIjoiY2s3ZWl4b3V1MDlkejNkb2JpZmtmbHp4ZiJ9.MbJU7PCa2LWBk9mENFkgxw";

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/cloudlun/clle3783901j201p43864c07n",
      center: defaultCoordinates,
      zoom: defaultZoom,
      minZoom: 10,
      maxZoom: 15,
      interactive: true,
      doubleClickZoom: false,
    });

    m.dragRotate.disable();
    m.touchZoomRotate.disableRotation();
    m.addControl(new mapboxgl.NavigationControl({
      showCompass: false,
      showZoom: true,
    }), 'bottom-right');

    // set map signal
    m.on('load', () => map.value = m);

    return () => {
      if (m) {
        m.remove();
        map.value = null;
      }
    };
  }, []);

  
  return (
    <div className='relative w-full h-full'>
      <Nav />
      <DatasetSelections />
      <MapDateSelections />
      <div className='w-full h-[calc(100%_-_3.125rem)]' ref={mapContainer} />
    </div>
  );
};

export default MapPage;
