"use client"

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label, ResponsiveContainer } from 'recharts';

// Display a bar chart
// Expected Props:
// - data: Object containing score counts
export default function ReviewScoreCountBarChart(props) {

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
          <XAxis dataKey={"count"} hide />
          <Bar dataKey="count" fill="#8884d8" label={{ position: 'right' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}