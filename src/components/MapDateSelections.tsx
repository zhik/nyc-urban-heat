import { useState, useContext, Dispatch, SetStateAction, } from "react"

import { MapLayersContext, MapLayersContextType } from '../contexts/mapLayersContext'
import { useQuery } from 'react-query';

//@ts-ignore
import { fetchSurfaceTemp } from "../api/api.js"


import { useMediaQuery } from "react-responsive"
import { CalendarDaysIcon } from "@heroicons/react/24/outline"
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid'


type Props = {
  date: string
  setDate: Dispatch<SetStateAction<string | null>>
}

const formatDateString = (dateString: string) => {
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthName = months[parseInt(month, 10) - 1];

  return `${monthName} ${parseInt(day, 10)}, ${year}`;
};



const MapDateSelections = ({ date, setDate }: Props) => {

  const { layer } = useContext(MapLayersContext) as MapLayersContextType

  const [expand, setExpand] = useState(false)
  const isTablet = useMediaQuery({
    query: '(min-width: 768px)'
  })


  const surfaceTemperatureQuery = useQuery({ queryKey: ['temperature'], queryFn: fetchSurfaceTemp })
  //@ts-ignore
  const clippedPMTiles = surfaceTemperatureQuery.data?.filter(d => d.filename.includes("ST_Clipped_")) || [];



  const years = ["2023", "2022", "2021", "2020", "2019", "2017", "2016", "2014", "2013"]



  return (
    <div className={`absolute left-[22rem] top-[4.625rem] bg-white rounded-[0.5rem] cursor-pointer overflow-hidden`} onClick={() => setExpand(!expand)}>
      <div className="flex justify-between items-center gap-3 px-5 h-[4rem] ">
        <CalendarDaysIcon width={24} height={24} className="" />
        {isTablet && <div className="mr-5 font-medium text-regular">{layer ? date : "Available Datasets"}</div>}
        {expand ? <ChevronUpIcon width={24} height={24} />
          : <ChevronDownIcon width={24} height={24} />}
      </div>
      <div className={`flex flex-col gap-4 my-3 w-full ${!expand ? "hidden" : "h-[60vh] overflow-scroll"}`}>
        {
          years.map((y) => {
            return (
              <div className="" key={y}>
                <h3 className="px-5 font-medium text-regular text-[#4F4F4F]">{y}</h3>
                <div className='my-2 h-[1px] bg-[#828282]'></div>
                <div className="flex flex-col items-start ">
                  {
                    //@ts-ignore
                    clippedPMTiles.filter(d => d.date.includes(y)).map((d) => (
                      <div key={d.date} className="pl-12 py-2 w-full font-medium text-regular hover:bg-[#E0E0E0]" onClick={() => {
                        setDate(d.date)
                      }}>
                        {formatDateString(d.date)}
                      </div>
                    ))
                  }
                </div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

export default MapDateSelections


{/* <div className="">
<h3 className="px-5 font-medium text-regular text-[#4F4F4F]">2022</h3>
<div className='my-2  h-[1px] bg-[#828282]'></div>
<div className="flex flex-col items-start">
  {
    //@ts-ignore
    clippedPMTiles.filter(d => d.date.includes("2022")).map((d) => (
      <div key={d.date} className="px-12 py-2 w-full font-medium text-regular hover:bg-[#E0E0E0]" onClick={() => setDate(d.date)}>
        {formatDateString(d.date)}
      </div>
    ))
  }
</div>
</div> */}