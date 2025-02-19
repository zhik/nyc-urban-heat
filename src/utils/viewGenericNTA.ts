import ntaFeatureCollection from "../data/nta.geo.json";
import mapboxgl, { MapLayerMouseEvent, Popup } from "mapbox-gl";

import { FeatureCollection } from "geojson";
import { GeoJSONTransformHandler } from "./geojson";

import { format } from "d3-format";
import { nta_dataset_info, out_door_heat_index } from "../App";
import {
  isNeighborhoodProfileExpanded,
  neighborhoodProfileData,
  clickedNeighborhoodPopup,
  isDataSelectionExpanded,
  previousClickCor,
  clickedNeighborhoodInfo,
  clickedWeatherStationNeighborhoodID,
} from "../pages/MapPage";

import "../pages/Map.css";
import { centerOfMass } from "@turf/turf";
import { useEffect } from "react";

let hoveredNtacode: null | string = null;
let clickedNtacode: null | string = null;

function getDataset(metric: string) {
  return nta_dataset_info.value.find((dataset) => dataset.metric === metric);
}

function getNTAInfo(nta: string) {
  return nta_dataset_info.value.map((dataset) => ({
    metric: dataset.metric,
    [nta]: dataset[nta],
  }));
}

export function createNtaLayer(
  map: mapboxgl.Map,
  metric: string,
      //@ts-ignore
  layerName: string,
  breakpoints: { label: string; value: string }[],
  fillPaintStyles: any = { "fill-color": "rgba(0,0,0,0)" }
) {
  const sourceId = metric + "_SOURCE";
  const layerFillId = metric + "_FILL";
  const layerOutlineId = metric + "_OUTLINE";
  const layerBasicOutlineId = metric + "_BASICOUTLINE";
  let popup = new Popup({
    closeButton: true,
  });

  const data = getDataset(metric);

  // merge in data with nta
  const features = GeoJSONTransformHandler(
    (ntaFeatureCollection as FeatureCollection).features
  )
    .map((feature) => {
      if (feature.properties) {
        const { ntacode } = feature.properties;
        feature.properties[metric] = +data[ntacode];

        if (metric === "NTA_PCT_MRT_Less_Than_110") {
          feature.properties[metric] *= 100;
        }
      }

      return feature;
    })
    .filter(
      (feature) =>
        feature.properties &&
        feature.properties[metric] &&
        !feature.properties.ntaname.includes("park-cemetery")
    );

  // create layers
  map.addSource(sourceId, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features,
    } as FeatureCollection,
    promoteId: "ntacode",
  });

  map.addLayer({
    id: layerFillId,
    type: "fill",
    source: sourceId,
    layout: {},
    paint: fillPaintStyles,
  });

  map.addLayer({
    id: layerBasicOutlineId,
    type: "line",
    source: sourceId,
    layout: {},
    paint: {
      "line-color": "#ffffff",
      "line-width": 1,
    },
  });

  map.addLayer({
    id: layerOutlineId,
    type: "line",
    source: sourceId,
    layout: {},
    paint: {
      "line-color": [
        "case",
        ["boolean", ["feature-state", "clicked"], false],
        "#0079DA", // Clicked NTA outline color
        ["boolean", ["feature-state", "hovered"], false],
        "#666666", // Hovered NTA outline color
        "rgba(0, 0, 0, 0)", // Default (no outline if not hovered or clicked)
      ],
      "line-width": [
        "case",
        ["boolean", ["feature-state", "clicked"], false],
        2.5, // Thicker line for clicked NTA
        ["boolean", ["feature-state", "hovered"], false],
        2.5, // Thinner line for hovered NTA
        0, // No line for default
      ],
    },
  });

  map.on("mousemove", layerFillId, (e: MapLayerMouseEvent) => {
    map.getCanvas().style.cursor = "pointer";
    if (e.features) {
      isDataSelectionExpanded.value = false;

      const {
        ntacode,
        boroname,
        ntaname,
        [metric]: selectedMetric,
      } = e.features[0].properties as any;

      const sortedBreakpoints = breakpoints.sort(
        (a, b) => parseInt(b.label) - parseInt(a.label)
      );

      const selectedBreakpoint = breakpoints.find(
        (breakpoint, index, array) => {
          const currentLabel = parseInt(breakpoint.label);
          const nextLabel =
            index < array.length - 1
              ? parseInt(array[index + 1].label)
              : -Infinity;
          return selectedMetric <= currentLabel && selectedMetric > nextLabel;
        }
      );

      const selectedPermeableSurfaveValue = (+out_door_heat_index.value.filter(
        (d) => d.ntacode === ntacode
      )[0]["pct_permeable"]).toFixed(0);
      const selctedTreeCanopyValue = (+out_door_heat_index.value.filter(
        (d) => d.ntacode === ntacode
      )[0]["pct_trees"]).toFixed(0);
      const selectedCoolRoofsValue = (+out_door_heat_index.value.filter(
        (d) => d.ntacode === ntacode
      )[0]["pct_Area_coolRoof"]).toFixed(0);
      const selectedSTValue = (+out_door_heat_index.value.filter(
        (d) => d.ntacode === ntacode
      )[0]["Relative_ST_Average"]).toFixed(0);

      const backgroundColor = `background-color: ${selectedBreakpoint!.value}`;
      const textColor =
        selectedMetric > parseInt(sortedBreakpoints[2].label)
          ? "text-[#FFF]"
          : selectedMetric > parseInt(sortedBreakpoints[3].label)
          ? "text-[#000]"
          : "text-[#333]";

      const title = `<div class="px-[1rem] py-[0.5rem] ${textColor} rounded-t-[0.75rem]" style="${backgroundColor}">
                              <div>
                                  <h1 class='font-bold text-[1.125rem]'>${ntaname}</h1>
                                  <h1 class='font-medium text-[0.75rem]'>${boroname}</h1>
                              </div>
                          </div>`;

      const details = `
              <div class="flex flex-col gap-[0.75rem] px-[1rem] pt-[1rem] pb-[1rem] bg-[#333] rounded-b-[0.75rem]">
                  <div class="font-medium text-[0.75rem] text-white leading-normal">
                  ${
                    metric === "PCT_AREA_COOLROOF"
                      ? "Cool roofs reflect more solar heat and mitigate urban heat island by lowering outdoor temperatures."
                      : metric === "NTA_PCT_MRT_Less_Than_110"
                      ? "Tolerable thermal comfort areas have a Mean Radiant Temperature (MRT) at or below 110° F."
                      : metric === "PCT_PERMEABLE"
                      ? "Permeable surfaces such as soil or grass retain less heat and mitigate air temperature and mean radiant temperature."
                      : metric === "PCT_TREES"
                      ? "Urban tree canopy measures the layer of leaves, branches and stems of trees that shelter the ground."
                      : ""
                  }

                  </div>
                  <div class="flex items-start gap-3">
                    <div class="flex flex-col items-center px-[0.625rem] py-[0.25rem] leading-tight" style="${backgroundColor}">
                      <div class='font-bold text-[1rem] ${textColor}'>${Math.round(
        selectedMetric
      )}%</div>
                      <div class='font-medium text-[0.75rem] ${textColor}'>low</div>                   
                    </div>
                    <div>
                      <div class="font-semibold text-[1rem] text-white whitespace-nowrap">
                          ${
                            metric === "PCT_AREA_COOLROOF"
                              ? "Area of buildings with cool roofs"
                              : metric === "NTA_PCT_MRT_Less_Than_110"
                              ? "Outdoor area with thermal comfort"
                              : metric === "PCT_PERMEABLE"
                              ? "Area with permeable surfaces"
                              : metric === "PCT_TREES"
                              ? "Area covered by tree canopy"
                              : "Average Surface Temperature"
                          }                    
                      </div>
                      <div class='font-light text-[0.75rem] text-[#D9D9D9] leading-normal'>
                            ${
                              metric === "PCT_AREA_COOLROOF"
                                ? `4,000 sf cool roof area of 100,000 sf total building area in ${ntaname}`
                                : metric === "NTA_PCT_MRT_Less_Than_110"
                                ? `8,500 sf with MRT at or below 110° F of 100,000 sf total outdoor area in ${ntaname}`
                                : metric === "PCT_PERMEABLE"
                                ? `4,000 sf permeable surface area of 100,000 sf total area in ${ntaname}`
                                : metric === "PCT_TREES"
                                ? `4,000 sf urban tree canopy area of 100,000 sf total area in ${ntaname}`
                                : `in ${ntaname} on [date]`
                            }   
                      </div>    
                    </div>
                  </div>
                  ${
                    metric === "NTA_PCT_MRT_Less_Than_110"
                      ? `<div class="flex items-start ">
                    <div class="flex flex-col items-center px-[0.625rem] font-bold text-[1rem] text-white leading-tight">120° F</div>
                    <div class="font-semibold text-[1rem] text-white">Average Mean Radiant Temperature</div>
                     </div>`
                      : ""
                  }
              </div>`;

      const outdoorHeatExposureIndexTitle = `
      <div class="flex justify-between items-center px-[1rem] py-[0.5rem] ${textColor} rounded-t-[0.75rem]" style="${backgroundColor}">
                              <div>
                                  <h1 class='font-bold text-[1.125rem]'>${ntaname}</h1>
                                  <h1 class='font-medium text-[0.75rem]'>${boroname}</h1>
                              </div>
                              <div class="font-bold text-[36px] ">${selectedMetric.toFixed(
                                1
                              )}</div>
                          </div>
      `;

      const outdoorHeatExposureIndexDetails = `
                    <div class="flex flex-col gap-[0.75rem] px-[1rem] pt-[1rem] pb-[1rem] font-regular text-white bg-[#333] rounded-b-[0.75rem]">
                              <div class="flex items-center gap-4">
                              <div class="flex justify-center items-center w-[40px] h-8 font-medium text-[1rem] text-black bg-[#C68165] border-[1px] border-white">0°F</div>
                              <div class="text-[14px] text-white">Average Mean Radiant Temperature</div>
                              </div>
                              <div class="flex items-center gap-4">
                              <div class="flex justify-center items-center w-[40px] h-8 font-semibold text-[14px] text-black bg-[#F4E0D7] border-[1px] border-white">${selectedSTValue}°F</div>
                              <div class="text-[14px] text-white">Average Surface Temperature</div>
                              </div>
                              <div class="flex items-center gap-4">
                              <div class="flex justify-center items-center w-[40px] h-8 font-semibold text-[14px] text-black bg-[#D2D4D8] border-[1px] border-white">${selectedCoolRoofsValue}%</div>
                              <div class="text-[14px] text-white">Area of buildings with cool roofs</div>
                              </div>
                              <div class="flex items-center gap-4">
                              <div class="flex justify-center items-center w-[40px] h-8 font-semibold text-[14px] text-white bg-[#5C7D86] border-[1px] border-white">${selctedTreeCanopyValue}%</div>
                              <div class="text-[14px] text-white">Area covered by tree canopy</div>
                              </div>
                              <div class="flex items-center gap-4">
                              <div class="flex justify-center items-center w-[40px] h-8 font-semibold text-[14px] text-black bg-[#F3D9B1] border-[1px] border-white">${selectedPermeableSurfaveValue}°F</div>
                              <div class="text-[14px] text-white">Area with permeable surfaces</div>
                              </div>
                    </div>
      `;

      //   <div class="flex items-start gap-[1.375rem]">
      //   <div class="font-semibold text-[1rem] text-white">120℉</div>
      //   <div class="font-medium text-[1rem] text-white">Average Mean Radiant Temperature</div>
      // </div>

      const divElement = document.createElement("div");

      divElement.innerHTML = metric === "Outdooor_Heat_Volnerability_Index" ? outdoorHeatExposureIndexTitle + outdoorHeatExposureIndexDetails : title + details;
      divElement.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.3)";
      divElement.style.borderRadius = "8px";

      const ntaCenter = centerOfMass(e.features[0]).geometry.coordinates;
      // const selectedCoordinates = e.features[0].geometry.coordinates.flat(Infinity);
      // const northLatitude = Math.max(...selectedCoordinates.filter((_, i) => i % 2 !== 0));
      // [ntaCenter[0], northLatitude]

      const coordinates = e.lngLat;

      const lng = ntaCenter[0];
      const lat = ntaCenter[1];

      const mousePosY = e.originalEvent.clientY;
      const mapHeight = map.getContainer().clientHeight;

      if (popup) popup.remove();

      popup = new Popup({
        closeButton: false,
        maxWidth: "365px",
      })
        .setLngLat(coordinates)
        .setDOMContent(divElement)
        .setOffset([0, 0])
        .addTo(map);

      if (hoveredNtacode !== null && hoveredNtacode !== ntacode) {
        map.setFeatureState(
          { source: sourceId, id: hoveredNtacode },
          { hovered: false }
        );
      }

      // Set new hovered NTA
      hoveredNtacode = ntacode;
      map.setFeatureState({ source: sourceId, id: ntacode }, { hovered: true });
    }
  });

  map.on("mouseleave", layerFillId, () => {
    map.getCanvas().style.cursor = "";
    if (popup) popup.remove();

    // Reset hovered state on mouse leave
    if (hoveredNtacode !== null) {
      map.setFeatureState(
        { source: sourceId, id: hoveredNtacode },
        { hovered: false }
      );
      hoveredNtacode = null; // Reset to null
    }
  });

  map?.on("click", layerFillId, (e: MapLayerMouseEvent) => {
    const { ntacode, ntaname, boroname } = e.features![0].properties as any;


    clickedNeighborhoodInfo.value = {
      code: ntacode,
      boro: boroname,
      nta: ntaname,
    };

    isNeighborhoodProfileExpanded.value = true;
    isDataSelectionExpanded.value = false;

    const clickedLat = e.lngLat.lat;
    const clickedLng = e.lngLat.lng;

    previousClickCor.value = [clickedLng, clickedLat];

    const bounds = map.getBounds();

    const centerCoordinates = map.getCenter();
    const centerLng = centerCoordinates.lng;

    const mapWidth = bounds.getEast() - bounds.getWest();

    const targetLng = bounds.getWest() + mapWidth * 0.175;

    const newLng = centerLng + (clickedLng - targetLng) * 0.65;

    const offsetLat = 0.005;
    const tooltipLat = clickedLat + offsetLat;

    if (clickedNeighborhoodPopup) {
      clickedNeighborhoodPopup.value?.remove();
      clickedNeighborhoodPopup.value = null;
    }

    clickedNeighborhoodPopup.value = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "clicked-popup",
    })
      .setLngLat([clickedLng, tooltipLat])
      .setHTML(`<div class='clicked-nta'>${ntaname}</div>`)
      .addTo(map);

    map.flyTo({
      center: [newLng, clickedLat],
      zoom: map.getZoom(),
      essential: true,
      duration: 2000,
      easing: (t) => t * (2.5 - t),
    });

    if (clickedNtacode !== null) {
      map.setFeatureState(
        { source: sourceId, id: clickedNtacode },
        { clicked: false }
      );
    }

    if (clickedWeatherStationNeighborhoodID !== null) {
      map.setFeatureState(
        { source: sourceId, id: clickedWeatherStationNeighborhoodID.value! },
        { clicked: false }
      );
    }

    clickedNtacode = ntacode;
    map.setFeatureState({ source: sourceId, id: ntacode }, { clicked: true });
  });

  return function onDestory() {
    map.removeLayer(layerFillId);
    map.removeLayer(layerOutlineId);
    map.removeLayer(layerBasicOutlineId);
    map.removeSource(sourceId);
    removeAllPopupsAndBorders(map, sourceId);
  };
}

export function removeAllPopupsAndBorders(map: mapboxgl.Map, sourceId: string) {
  document
    .querySelectorAll(".mapboxgl-popup")
    .forEach((popup) => popup.remove());

  if (clickedNtacode !== null) {
    try {
      if (map.getSource(sourceId)) {
        map.setFeatureState(
          { source: sourceId, id: clickedNtacode },
          { clicked: false }
        );
      }
      clickedNtacode = null;
    } catch (error) {
      console.error("Error resetting feature state:", error);
    }
  }
}
