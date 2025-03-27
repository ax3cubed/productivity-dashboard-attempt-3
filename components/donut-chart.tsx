"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { motion, AnimatePresence } from "motion/react"

interface ChartData {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: ChartData[]
  height?: number
  width?: number
  onSegmentClick?: (segment: ChartData) => void
}

export function DonutChart({ data, height = 300, width = 300, onSegmentClick }: DonutChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [activeSegment, setActiveSegment] = useState<ChartData | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3.select(svgRef.current)
    const radius = Math.min(width, height) / 2
    const innerRadius = radius * 0.6
    const outerRadius = radius * 0.9

    const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`)

    // Create the pie layout
    const pie = d3
      .pie<ChartData>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.02)

    // Create the arc generator
    const arc = d3.arc<d3.PieArcDatum<ChartData>>().innerRadius(innerRadius).outerRadius(outerRadius).cornerRadius(4)

    // Create the hover arc generator (slightly larger)
    const hoverArc = d3
      .arc<d3.PieArcDatum<ChartData>>()
      .innerRadius(innerRadius - 5)
      .outerRadius(outerRadius + 10)
      .cornerRadius(4)

    // Create the arcs
    const arcs = g.selectAll(".arc").data(pie(data)).enter().append("g").attr("class", "arc").style("cursor", "pointer")

    // Add the paths (slices) with initial animation
    arcs
      .append("path")
      .attr("d", (d) => arc(d as d3.PieArcDatum<ChartData>))
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .delay((_, i) => i * 100)
      .style("opacity", 1)
      .attrTween("d", (d) => {
        const i = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d)
        return (t) => arc(i(t))!
      })

    // Add hover and click interactions
    arcs
      .on("mouseover", function (event, d) {
        d3.select(this).select("path").transition().duration(200).attr("d", function (d) {
          return hoverArc(d as d3.PieArcDatum<ChartData>)
        })

        const [x, y] = arc.centroid(d)
        setTooltipPosition({
          x: x + width / 2,
          y: y + height / 2,
        })
        setActiveSegment(d.data)
        setIsTooltipVisible(true)
      })
      .on("mouseout", function () {
        d3.select(this).select("path").transition().duration(200).attr("d", (d) => arc(d as d3.PieArcDatum<ChartData>))

        setIsTooltipVisible(false)
      })
      .on("click", function (_, d) {
        if (onSegmentClick) {
          onSegmentClick(d.data)
        }

        // Add a pulse animation on click
        d3.select(this)
          .select("path")
          .transition()
          .duration(100)
          .attr("d", (d) => hoverArc(d as d3.PieArcDatum<ChartData>))
          .transition()
          .duration(100)
          .attr("d", (d) => arc(d as d3.PieArcDatum<ChartData>))
          .transition()
          .duration(100)
          .attr("d", (d) => hoverArc(d as d3.PieArcDatum<ChartData>))
          .transition()
          .duration(100)
          .attr("d", (d) => arc(d as d3.PieArcDatum<ChartData>))
      })

    // Add center text with counter animation
    const total = d3.sum(data, (d) => d.value)

    const centerText = g
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0em")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .style("fill", "currentColor")

    // Animate the counter
    const startValue = 0
    const duration = 1500
    const frameDuration = 16
    const totalFrames = Math.round(duration / frameDuration)
    const valuePerFrame = total / totalFrames

    const animate = () => {
      let currentFrame = 0

      const timer = setInterval(() => {
        currentFrame++
        const currentValue = Math.min(Math.round(startValue + currentFrame * valuePerFrame), total)
        centerText.text(`${currentValue}`)

        if (currentFrame === totalFrames) {
          clearInterval(timer)
        }
      }, frameDuration)
    }

    animate()

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.5em")
      .style("font-size", "14px")
      .style("fill", "currentColor")
      .text("Tasks")
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1)
  }, [data, height, width, onSegmentClick])

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <svg ref={svgRef} width={width} height={height} />

      <AnimatePresence>
        {isTooltipVisible && activeSegment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute pointer-events-none bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md z-50 min-w-[120px]"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="font-medium">{activeSegment.name}</div>
            <div className="flex justify-between items-center mt-1">
              <div className="text-sm text-muted-foreground">Value:</div>
              <div className="font-medium">{activeSegment.value}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Percentage:</div>
              <div className="font-medium">
                {((activeSegment.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="w-3 h-3 absolute -bottom-1.5 left-1/2 -translate-x-1/2 rotate-45 bg-popover"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

