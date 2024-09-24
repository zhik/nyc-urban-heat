import { useState, useRef } from 'react'
import { map, selectedDataset, isProfileExpanded } from '../pages/MapPage'
import DatasetSelectionOption from './DatasetSelectionOption'

import { Dataset, datasets } from '../utils/datasets'
import { group } from 'd3-array';
import { ChevronUpIcon, ChevronDownIcon, ArrowDownTrayIcon } from '@heroicons/react/20/solid'

const groupedDataset = group(datasets, d => d.group)

const DatasetSelections = () => {
  const [isExpanded, setExpanded] = useState(true)
  const destroyCallbackRef = useRef<any>(null);
 
  function initializeView(dataset: Dataset) {
    // fail states
    if (!dataset.currentView) return
    if (!map.value) return

    // remove the previous view
    if(destroyCallbackRef.current) destroyCallbackRef.current()

    const view = dataset.views[dataset.currentView]
    if (view.init) {
      console.log(`init ${dataset.name}, ${dataset.currentView}`)
      destroyCallbackRef.current = view.init(map.value);
    } else {
      console.error(`${dataset.name}, ${dataset.currentView} doesn't have an init func`)
      destroyCallbackRef.current = null
    }
  }

  const handleDatasetChange = (e: React.MouseEvent<HTMLDivElement>, dataset: Dataset) => {
    e.stopPropagation()
    // set current view to be the first one, if it is null
    if (!dataset.currentView) {
      dataset.currentView = Object.keys(dataset.views)[0]
    }
    selectedDataset.value = dataset

    // toggle off profile
    isProfileExpanded.value = false

    initializeView(dataset)
  }

  const handleViewChange = (e: React.MouseEvent<HTMLDivElement>, dataset: Dataset) => {
    e.stopPropagation()
    // swap views
    if (dataset.currentView) {
      const views = Object.keys(dataset.views)
      const currentViewIndex = views.indexOf(dataset.currentView)
      if (currentViewIndex < views.length - 1) {
        dataset.currentView = views[currentViewIndex + 1]
      } else {
        dataset.currentView = views[0]
      }
      selectedDataset.value = { ...dataset }

      initializeView(dataset)
    }
  }

  return (
    <div className={`absolute left-6 top-[4.625rem] w-[20rem] ${!isExpanded ? "h-[3.5rem] overflow-hidden" : "pb-4 h-[70%]"} bg-[#1B1B1B] rounded-lg drop-shadow-lg z-[999] cursor-pointer`}    >
      <div className='flex justify-between items-center px-5 h-[3.5rem]' onClick={() => setExpanded(!isExpanded)}>
        <div className="flex items-center gap-3 ">
          {
            selectedDataset.value && <img src={selectedDataset.value?.icon} alt="" className="w-6 h-6 text-[#BDBDBD]" />
          }
          <h2 className={`font-medium text-regular text-[#F2F2F2]`}>{selectedDataset.value?.name ?? 'Urban Heat Data Layers'}</h2>
        </div>
        {isExpanded ? <ChevronUpIcon width={24} height={24} className='text-[#BDBDBD]' />
          : <ChevronDownIcon width={24} height={24} className='text-[#BDBDBD]' />}
      </div>
      {
        isExpanded && (
          <>
            <div className='h-[calc(100%_-_7.25rem)] overflow-y-scroll overflow-hidden scrollbar'>

              {Array.from(groupedDataset).map(([category, values]) => (
                <div key={category}>
                  {category !== '' ? <h3 className="px-6 pt-3 pb-1 text-regular text-[#BDBDBD]">{category}</h3> : ''}
                  <>
                    {values.map((dataset: Dataset) => <DatasetSelectionOption
                      key={dataset.name}
                      dataset={dataset}
                      handleDatasetChange={handleDatasetChange}
                      handleViewChange={handleViewChange}
                    />)}
                  </>
                </div>
              ))}
              =
            </div>
            <div className='flex justify-between items-center mt-3 px-2 py-6 m-auto w-[calc(100%_-_40px)] h-8 bg-[#4F4F4F] rounded-[0.25rem] cursor-pointer' onClick={() => setExpanded(true)}>
              <div className='font-bold text-regular text-[#F2F2F2]'>Download dataset(s)</div>
              <ArrowDownTrayIcon width={18} height={18} className='text-[#F2F2F2]' />
            </div>
          </>
        )
      }
    </div>
  )
}

export default DatasetSelections