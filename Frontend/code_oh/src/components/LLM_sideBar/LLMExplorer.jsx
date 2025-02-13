import { Box, useColorMode, IconButton } from '@chakra-ui/react'
import { ArrowUpWideNarrow } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "../../styles/searchInput.css";
import React, { useState } from 'react'

import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';


import SearchInput from './SearchInput';


/**
 * LLMExplorer component that serves as a container for the AI chat interface.
 * Provides a full-height container for the SearchInput component with proper spacing.
 * 
 * @component
 * @returns {JSX.Element} A container box with the SearchInput component
 */
export const LLMExplorer = () => {
    // Theme context hook for color mode
    const { colorMode } = useColorMode()

    const HorizontalResizeHandle = () => (
        <PanelResizeHandle
            style={{
                height: '4px',
                background: colorMode === 'dark' ? '#2D3748' : '#E2E8F0',
                cursor: 'row-resize'
            }}
        />
    )


    return (
        <PanelGroup direction="vertical">
            <Panel defaultSize={75} minSize={20} maxSize={90}>
                <div className="overflow-y-auto styled-wrapper w-full h-full flex flex-col chat-section p-4">

                    <div className="llm-bubble w-fit max-w-[80%] bg-gray-600 text-white p-3 rounded-lg mb-5 ml-auto">
                        <p>How does a car engine work?</p>
                    </div>

                    <div className="llm-bubble w-auto max-w-[80%] bg-gray-600 text-white p-3 rounded-lg mb-5">
                        <span className='font-bold'>Model</span>
                        <div className='my-1'></div>
                        <hr className=""></hr>
                        <div className='my-3'></div>
                        <p>A car engine works by converting fuel into mechanical energy through a process called internal combustion. Inside the engine, fuel mixes with air and is ignited by a spark, creating small explosions that push pistons. These pistons move up and down, turning the crankshaft, which ultimately powers the wheels of the car. The entire process happens repeatedly in a controlled sequence, allowing the vehicle to move efficiently.</p>
                    </div>


                    <div className="llm-bubble w-fit max-w-[80%] bg-gray-600 text-white p-3 rounded-lg mb-5 ml-auto">
                        <p>How does a car engine work?</p>
                    </div>

                    <div className="llm-bubble w-auto max-w-[80%] bg-gray-600 text-white p-3 rounded-lg mb-5">
                        <span className='font-bold'>Model</span>
                        <div className='my-1'></div>
                        <hr className=""></hr>
                        <div className='my-3'></div>
                        <p>A car engine works by converting fuel into mechanical energy through a process called internal combustion. Inside the engine, fuel mixes with air and is ignited by a spark, creating small explosions that push pistons. These pistons move up and down, turning the crankshaft, which ultimately powers the wheels of the car. The entire process happens repeatedly in a controlled sequence, allowing the vehicle to move efficiently.</p>
                    </div>


                    <div className="llm-bubble w-fit max-w-[80%] bg-gray-600 text-white p-3 rounded-lg mb-5 ml-auto">
                        <p>How does a car engine work?</p>
                    </div>

                    <div className="llm-bubble w-auto max-w-[80%] bg-gray-600 text-white p-3 rounded-lg mb-5">
                        <span className='font-bold'>Model</span>
                        <div className='my-1'></div>
                        <hr className=""></hr>
                        <div className='my-3'></div>
                        <p>A car engine works by converting fuel into mechanical energy through a process called internal combustion. Inside the engine, fuel mixes with air and is ignited by a spark, creating small explosions that push pistons. These pistons move up and down, turning the crankshaft, which ultimately powers the wheels of the car. The entire process happens repeatedly in a controlled sequence, allowing the vehicle to move efficiently.</p>
                    </div>


                    <div className="llm-bubble w-fit max-w-[80%] bg-gray-600 text-white p-3 rounded-lg mb-5 ml-auto">
                        <p>How does a car engine work?</p>
                    </div>

                    <div className="llm-bubble w-auto max-w-[80%] bg-gray-600 text-white p-3 rounded-lg mb-5">
                        <span className='font-bold'>Model</span>
                        <div className='my-1'></div>
                        <hr className=""></hr>
                        <div className='my-3'></div>
                        <p>A car engine works by converting fuel into mechanical energy through a process called internal combustion. Inside the engine, fuel mixes with air and is ignited by a spark, creating small explosions that push pistons. These pistons move up and down, turning the crankshaft, which ultimately powers the wheels of the car. The entire process happens repeatedly in a controlled sequence, allowing the vehicle to move efficiently.</p>
                    </div>


                </div>
            </Panel>

            <HorizontalResizeHandle />

            <Panel defaultSize={25} minSize={29} maxSize={50} className="input-section">
                <div className="resizable-section p-2 h-full flex">

                    <Box
                        h="100%"
                        w="100%"
                        p={4}
                    >
                        <SearchInput />
                    </Box>

                </div>
            </Panel>
        </PanelGroup>
    );

}