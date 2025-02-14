"use client"

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label, ResponsiveContainer, Cell } from 'recharts';

// Display a bar chart
// Expected Props:
// - data: Object containing score counts
// - dataCallback: Function - Callback function to set data
export default function ReviewScoreCountBarChart(props) {
  const [currIndex, setCurrIndex] = useState(5)

  const handleClick = (data, index) => {
    setCurrIndex(index)
    if(props.dataCallback) {
      props.dataCallback(data['score'])
    }
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute -left-5 bottom-1/2 -rotate-90 -mb-3">
        <p>Scores Given</p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          width={150} 
          height={40} 
          data={props.data} 
          layout="vertical"
        >
          <YAxis 
            dataKey="score" 
            type="category" 
            reversed
          />
          <XAxis 
            dataKey={"count"} 
            type="number"
            domain={["dataMin", "dataMax + 1"]}
            hide
          />
          <Bar 
            dataKey="count" 
            label={{ position: 'right' }}
            onClick={handleClick}
          >
            {props.data.map((entry, index) => (
              <Cell cursor="pointer" fill={index === currIndex ? '#82ca9d' : '#8884d8'} key={`cell-${index}`} />
             ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}