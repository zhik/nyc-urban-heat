import { ChevronLeftIcon, ChevronRightIcon, ArrowLongRightIcon, InformationCircleIcon } from '@heroicons/react/20/solid'
import { useState } from "react"
import { useMediaQuery } from "react-responsive"
import OverviewProfileChart from "./OverviewProfileChart"
import { isNeighborhoodProfileExpanded, isWeatherStationProfileExpanded, selectedDataset, neighborhoodProfileData, map, previousClickCor, clickedNeighborhoodInfo, clickedNeighborhoodPopup } from "../pages/MapPage"
import { datasets, initializeView } from "../utils/datasets"
import { viewWeatherStations } from "../utils/viewWeatherStations"

import InformationCircle from './InformationCircle'




// ntaneighborhoodProfileData 
const NeighborhoodProfile = () => {
    const [clickedIndex, setClickedIndex] = useState("cool_roofs")

    const isDesktop = useMediaQuery({
        query: '(min-width: 1024px)'
    })
    const isTablet = useMediaQuery({
        query: '(min-width: 768px)'
    })
    const printPage = () => {
        window.print();
    }

    const clickHandler = () => {
        isNeighborhoodProfileExpanded.value = !isNeighborhoodProfileExpanded.value
        if (isNeighborhoodProfileExpanded.value === false) {
            map.value!.flyTo({
                center: [-73.913, 40.763],
                zoom: 11,
                essential: true,
                duration: 2000,
                easing: (t) => t
            })
        }
    }


    const profileChangeClickHandler = () => {
        isNeighborhoodProfileExpanded.value = false
        isWeatherStationProfileExpanded.value = true
        selectedDataset.value = datasets[6]

        if (!datasets[6].currentView) {
            datasets[6].currentView = 'points'
        }

        initializeView(datasets[6], map.value).then(dataset => {
            console.log("Updated dataset:", dataset);
            selectedDataset.value = { ...dataset }
        })

        clickedNeighborhoodPopup.value?.remove()
    }

    // const { currentFeature, allFeatures } = ntaneighborhoodProfileData
    // if (Object.keys(currentFeature).length === 0) {
    //     // no feature is selected
    //     return (
    //         <div className={`transition-all duration-[1500ms] ${!profileExpanded && "translate-y-[70vh] lg:translate-y-0 lg:translate-x-[calc(75vw)] xl:translate-x-[calc(65vw)]"} absolute bottom-0 lg:top-[3.125rem] lg:right-0 flex items-center  z-20`}>
    //             {
    //                 isDesktop && <div className="flex items-center justify-center w-12 h-24 bg-[#1B1B1B] rounded-l-2xl cursor-pointer" onClick={clickHandler}>
    //                     {profileExpanded ? <ArrowRightIcon width={24} height={24} className="text-white" /> : <ArrowLeftIcon width={24} height={24} className="text-white" />}
    //                 </div>
    //             }
    //             <div className={`printable-white-bg px-4 lg:px-8 pt-12 py-6 lg:grid lg:grid-cols-6 lg:grid-rows-10  w-[100vw] lg:w-[75vw] xl:w-[65vw] h-[56vh] lg:h-[calc(100vh_-_3.125rem)] bg-[#1B1B1B] rounded-[1rem] lg:rounded-[0] overflow-y-auto `}>
    //                 <OverviewProfileChart allFeatures={allFeatures} clickedIndex={clickedIndex} />
    //             </div>
    //         </div>
    //     )
    // }

    // const { properties } = (currentFeature as any)
    // const { borough, ntaname } = properties

    // if (neighborhoodProfileData.value) {

    return (
        <div className={`transition-all duration-[1500ms] ${!isNeighborhoodProfileExpanded.value && "translate-y-[70vh] md:translate-y-0 md:translate-x-[calc(65vw)]"} absolute bottom-0 md:top-[3.125rem] md:right-0 flex items-center z-20`}>
            {
                isTablet && <div className="flex items-center justify-center w-9 h-24 bg-[#1B1B1B] rounded-l-2xl cursor-pointer" onClick={clickHandler}>
                    {isNeighborhoodProfileExpanded.value ? <ChevronRightIcon width={20} height={20} className="text-[#BDBDBD]" /> : <ChevronLeftIcon width={20} height={20} className="text-[#BDBDBD]" />}
                </div>
            }
            <div className={`printable-white-bg md:flex md:flex-col md:justify-center md:gap-[4rem] px-6 md:px-10 pt-12 pb-6 md:pt-0 md:pb-0 w-[100vw] md:w-[65vw] h-[70vh] md:h-[calc(100vh_-_3.125rem)] bg-[#1B1B1B] rounded-[1rem] md:rounded-[0] overflow-y-auto scrollbar`}>
                <div className="md:flex md:gap-8 md:h-[30%]">
                    <div className="md:flex md:flex-col md:w-[50%] h-full">
                        <h2 className="text-regular md:text-subheadline text-gray_six">{clickedNeighborhoodInfo.value?.boro}</h2>
                        <h1 className="md:mb-4 font-semibold text-subheadline md:text-headline text-gray_six">{clickedNeighborhoodInfo.value?.nta}</h1>
                        {
                            isTablet &&
                            <p className="flex-1 p-4 text-small text-[#D5D5D5] border-[1px] border-[#333] rounded-[0.75rem] overflow-y-scroll">
                                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Tempora,
                                sunt enim quos sapiente facere doloremque voluptate aspernatur sint eos debitis deserunt, quasi deleniti iste voluptatem aliquid voluptatibus, fuga assumenda. Eum?
                            </p>
                        }
                    </div>
                    <div className="md:flex md:flex-col md:gap-2 md:justify-center my-6 md:my-0 p-4 w-full md:w-[50%] md:h-full bg-[#333333] rounded-lg">
                        <div className="flex justify-between md:h-[35%]">
                            <h2 className="font-semibold w-[50%] min-w-[4rem] text-regular md:text-[1rem] lg:text-subheadline text-gray_six">Outdoor Heat Exposure Index</h2>
                            <div className="flex flex-col">
                                <h1 className="font-bold text-[2.5rem] lg:text-[3.5rem] text-gray_six leading-tight lg:leading-none ">4.0</h1>
                                <h3 className="font-regular text-regular lg:text-[1rem] text-[#BDBDBD]">Medium High</h3>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-2 mt-2 pt-4 border-t-[1px] border-[#757575] overflow-scroll">
                            <div className="flex justify-between items-center gap-4">
                                <h3 className="text-small text-gray_six min-w-20">Air Temperature</h3>
                                <div className="flex items-center gap-2.5">
                                    <InformationCircle size="small" />
                                    <div className="text-small text-[#C5C5C5]">Score</div>
                                    <div className="flex gap-1">
                                        <div className="w-7 h-2 rounded-l-[20px] bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 rounded-r-[20px] bg-[#D9D9D9]"></div>
                                    </div>
                                    <div className="text-small text-[#C5C5C5]">5</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <h3 className="text-small text-gray_six min-w-20">Mean Radiant Temperature</h3>
                                <div className="flex items-center gap-2.5">
                                    <InformationCircle size="small" />
                                    <div className="text-small text-[#C5C5C5]">Score</div>
                                    <div className="flex gap-1">
                                        <div className="w-7 h-2 rounded-l-[20px] bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 rounded-r-[20px] bg-[#D9D9D9]"></div>
                                    </div>
                                    <div className="text-small text-[#C5C5C5]">5</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <h3 className="text-small text-gray_six min-w-20">Tree Canopy</h3>
                                <div className="flex items-center gap-2.5">
                                    <InformationCircle size="small" />
                                    <div className="text-small text-[#C5C5C5]">Score</div>
                                    <div className="flex gap-1">
                                        <div className="w-7 h-2 rounded-l-[20px] bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 rounded-r-[20px] bg-[#D9D9D9]"></div>
                                    </div>
                                    <div className="text-small text-[#C5C5C5]">5</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <h3 className="text-small text-gray_six min-w-20">Cool Roofs</h3>
                                <div className="flex items-center gap-2.5">
                                    <InformationCircle size="small" />
                                    <div className="text-small text-[#C5C5C5]">Score</div>
                                    <div className="flex gap-1">
                                        <div className="w-7 h-2 rounded-l-[20px] bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 rounded-r-[20px] bg-[#4F4F4F]"></div>
                                    </div>
                                    <div className="text-small text-[#C5C5C5]">4</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <h3 className="text-small text-gray_six min-w-20">Premeable Surfaces</h3>
                                <div className="flex items-center gap-2.5">
                                    <InformationCircle size="small" />
                                    <div className="text-small text-[#C5C5C5]">Score</div>
                                    <div className="flex gap-1">
                                        <div className="w-7 h-2 rounded-l-[20px] bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 bg-[#D9D9D9]"></div>
                                        <div className="w-7 h-2 rounded-r-[20px] bg-[#4F4F4F]"></div>
                                    </div>
                                    <div className="text-small text-[#C5C5C5]">4</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:flex md:flex-col md:gap-6 w-full md:h-[55%]">
                    <div className="w-full h-[16rem] md:h-[90%] bg-[#333] rounded-[0.75rem]">
                        {/* {
                            isTablet &&
                            <div className="flex">
                                <button className={`pt-1 px-2 font-medium text-small border-[1px] border-b-0 rounded-t-[1.125rem] ${clickedIndex === "heat_vulnerability" ? "text-white bg-[#333] border-none " : "text-[#828282] border-[#828282"} `} onClick={() => setClickedIndex("heat_vulnerability")}>Heat Vulnerability Index</button>
                                <button className={`pt-1 px-2 font-medium text-small border-[1px] border-b-0 rounded-t-[1.125rem] ${clickedIndex === "cool_roofs" ? "text-white bg-[#333] border-none " : "text-[#828282] border-[#828282"} `} onClick={() => setClickedIndex("cool_roofs")}>Cool Roofs</button>
                                <button className={`pt-1 px-2 font-medium text-small border-[1px] border-b-0 rounded-t-[1.125rem] ${clickedIndex === "tree_canopies" ? "text-white bg-[#333] border-none " : "text-[#828282] border-[#828282"} `} onClick={() => setClickedIndex("tree_canopies")}>Tree Canopies</button>
                                <button className={`pt-1 px-2 font-medium text-small border-[1px] border-b-0 rounded-t-[1.125rem] ${clickedIndex === "cooling_centers" ? "text-white bg-[#333] border-none " : "text-[#828282] border-[#828282"} `} onClick={() => setClickedIndex("cooling_centers")}>Cooling Centers</button>
                            </div>
                        } */}
                    </div>
                    <div className="flex-1 flex md:justify-between md:items-center gap-5 md:gap-0">
                        <button onClick={printPage} className="print:hidden min-w-[9rem] h-[2.4rem] font-medium text-regular bg-[#E0E0E0] border-2 border-[#E0E0E0] rounded-[0.5rem]">
                            Print profile
                        </button>
                        {isTablet &&
                            <div className="flex items-center">
                                <button className="p-[0.625rem] text-regular text-[#E0E0E0]" onClick={profileChangeClickHandler}>View the closest weather station</button> :
                                <ArrowLongRightIcon width={24} height={24} className="text-white" />
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

//     return (<></>)
// }

export default NeighborhoodProfile