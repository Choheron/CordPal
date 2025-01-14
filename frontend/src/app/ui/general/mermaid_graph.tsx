'use client';
import { MermaidDiagram } from '@lightenna/react-mermaid-diagram';
// Makes use of this repo: https://github.com/lightenna/react-mermaid-diagram 
// Big thanks to this guy for his work

// Generate a mermaid diagram
// Expected Props:
// - graphText: String - Mermaid syntax graph text
export default function MermaidGraph(props) {
  return <MermaidDiagram>{props.graphText}</MermaidDiagram>;
}