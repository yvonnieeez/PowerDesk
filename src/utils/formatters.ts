import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatWatts(watts: number): string {
  return `${watts.toFixed(0)}W`;
}

export function formatKwh(kwh: number): string {
  return `${kwh.toFixed(2)} kWh`;
}

export function formatTime(isoString: string): string {
  return dayjs(isoString).format('HH:mm:ss');
}

export function formatRelativeTime(isoString: string): string {
  return dayjs(isoString).fromNow();
}

export function formatRoomName(room: string): string {
  return room
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
