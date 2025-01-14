'use client';
import { MermaidDiagram } from '@lightenna/react-mermaid-diagram';
// Makes use of this repo: https://github.com/lightenna/react-mermaid-diagram 
// Big thanks to this guy for his work ^

// In the event of my wanting to remove this library from this site, run the following:
// > npm uninstall mermaid
// > npm uninstall @lightenna/react-mermaid-diagram

// Generate a mermaid diagram
// Expected Props:
// - graphText: String - Mermaid syntax graph text
export default function MermaidGraph(props) {
  return <MermaidDiagram>{props.graphText}</MermaidDiagram>;
}