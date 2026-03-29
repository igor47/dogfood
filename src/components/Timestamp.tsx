import { formatTime as fmtTime, formatDatetime } from "@src/lib/dates"

interface TimestampProps {
  datetime: string
  format?: "datetime" | "time"
}

export const Timestamp = ({ datetime, format = "datetime" }: TimestampProps) => {
  const display = format === "time" ? fmtTime(datetime) : formatDatetime(datetime)
  return (
    <time datetime={datetime} title={`${datetime} UTC`}>
      {display}
    </time>
  )
}
