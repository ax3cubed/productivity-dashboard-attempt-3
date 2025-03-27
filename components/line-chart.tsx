"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface DataPoint {
  x: string
  y: number
}

interface LineData {
  name: string
  data: DataPoint[]
  color: string
}

interface LineChartProps {
  data: LineData[]
  yAxisLabel?: string
  yMax?: number
}

export function LineChart({ data, yAxisLabel = "Value", yMax }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || data[0].data.length === 0) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    const margin = { top: 20, right: 120, bottom: 60, left: 60 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Create scales
    const xScale = d3
      .scaleBand()
      .domain(data[0].data.map((d) => d.x))
      .range([0, innerWidth])
      .padding(0.2)

    const allValues = data.flatMap((series) => series.data.map((d) => d.y))
    const yScale = d3
      .scaleLinear()
      .domain([0, yMax || d3.max(allValues) || 0])
      .range([innerHeight, 0])
      .nice()

    // Create the main group element
    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`)

    // Add the x-axis
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")

    // Add the y-axis
    g.append("g").call(d3.axisLeft(yScale))

    // Add y-axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .text(yAxisLabel)
      .style("fill", "currentColor")

    // Create a line generator
    const line = d3
      .line<DataPoint>()
      .x((d) => (xScale(d.x) || 0) + xScale.bandwidth() / 2)
      .y((d) => yScale(d.y))
      .curve(d3.curveMonotoneX)

    // Add the lines
    data.forEach((series) => {
      // Add the line
      g.append("path")
        .datum(series.data)
        .attr("fill", "none")
        .attr("stroke", series.color)
        .attr("stroke-width", 3)
        .attr("d", line)

      // Add circles for each data point
      g.selectAll(`.dot-${series.name.replace(/\s+/g, "-")}`)
        .data(series.data)
        .enter()
        .append("circle")
        .attr("class", `dot-${series.name.replace(/\s+/g, "-")}`)
        .attr("cx", (d) => (xScale(d.x) || 0) + xScale.bandwidth() / 2)
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 5)
        .attr("fill", series.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)

      // Add tooltips for data points
      g.selectAll(`.dot-${series.name.replace(/\s+/g, "-")}`)
        .append("title")
        .text((d) => `${series.name}: ${d.y.toFixed(1)}`)
    })

    // Add legend
    const legend = svg.append("g").attr("transform", `translate(${width - margin.right + 20}, ${margin.top + 10})`)

    data.forEach((series, i) => {
      const legendRow = legend.append("g").attr("transform", `translate(0, ${i * 25})`)

      legendRow.append("rect").attr("width", 15).attr("height", 15).attr("fill", series.color)

      legendRow
        .append("text")
        .attr("x", 25)
        .attr("y", 12.5)
        .attr("text-anchor", "start")
        .style("font-size", "14px")
        .style("fill", "currentColor")
        .text(series.name)
    })
  }, [data, yAxisLabel, yMax])

  return (
    <div className="w-full h-full">
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  )
}

