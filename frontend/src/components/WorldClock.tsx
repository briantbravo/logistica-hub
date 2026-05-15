import React, { useEffect, useState } from 'react';
import { FiClock } from 'react-icons/fi';

interface TimeZone {
  name: string;
  offset: string;
  timezone: string;
}

interface ClockTime {
  timezone: string;
  time: string;
  date: string;
  hours: number;
  minutes: number;
  seconds: number;
}

const WorldClock: React.FC = () => {
  const [clocks, setClocks] = useState<ClockTime[]>([]);

  const timeZones: TimeZone[] = [
    { name: 'Colombia (Bogotá)', offset: 'UTC-5', timezone: 'America/Bogota' },
    { name: 'USA (Nueva York)', offset: 'UTC-4/-5', timezone: 'America/New_York' },
    { name: 'USA (Los Ángeles)', offset: 'UTC-7/-8', timezone: 'America/Los_Angeles' },
    { name: 'Reino Unido (Londres)', offset: 'UTC+0/+1', timezone: 'Europe/London' },
    { name: 'Alemania (Berlín)', offset: 'UTC+1/+2', timezone: 'Europe/Berlin' },
    { name: 'India (Delhi)', offset: 'UTC+5:30', timezone: 'Asia/Kolkata' },
    { name: 'China (Pekín)', offset: 'UTC+8', timezone: 'Asia/Shanghai' },
    { name: 'Japón (Tokio)', offset: 'UTC+9', timezone: 'Asia/Tokyo' },
    { name: 'Australia (Sídney)', offset: 'UTC+10/+11', timezone: 'Australia/Sydney' },
    { name: 'UTC (Hora Universal)', offset: 'UTC+0', timezone: 'UTC' },
  ];

  useEffect(() => {
    const updateClocks = () => {
      const newClocks = timeZones.map((tz) => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('es-ES', {
          timeZone: tz.timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

        const dateFormatter = new Intl.DateTimeFormat('es-ES', {
          timeZone: tz.timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

        const timeString = formatter.format(now);
        const dateString = dateFormatter.format(now);
        const [hours, minutes, seconds] = timeString.split(':').map(Number);

        return {
          timezone: tz.name,
          time: timeString,
          date: dateString,
          hours,
          minutes,
          seconds,
        };
      });

      setClocks(newClocks);
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);

    return () => clearInterval(interval);
  }, []);

  const ClockCard = ({ clock }: { clock: ClockTime }) => {
    const secondsRotation = (clock.seconds / 60) * 360;
    const minutesRotation = (clock.minutes / 60) * 360 + (clock.seconds / 60) * 6;
    const hoursRotation = (clock.hours % 12 / 12) * 360 + (clock.minutes / 60) * 30;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        {/* Location Name */}
        <div className="flex items-center gap-2 mb-4">
          <FiClock className="text-blue-500" size={20} />
          <h3 className="font-semibold text-gray-800">{clock.timezone}</h3>
        </div>

        {/* Analog Clock */}
        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32 rounded-full border-8 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-inner flex items-center justify-center">
            {/* Center Dot */}
            <div className="absolute w-3 h-3 bg-blue-600 rounded-full z-20"></div>

            {/* Hour Markers */}
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * 360;
              const isMainHour = i % 3 === 0;
              return (
                <div
                  key={i}
                  className={`absolute ${
                    isMainHour ? 'w-1.5 h-4 bg-gray-800' : 'w-1 h-2 bg-gray-600'
                  }`}
                  style={{
                    transform: `rotate(${angle}deg) translateY(-56px)`,
                    transformOrigin: 'center',
                  }}
                />
              );
            })}

            {/* Hour Hand */}
            <div
              className="absolute w-1 h-10 bg-gray-800 rounded-full origin-bottom"
              style={{
                transform: `rotate(${hoursRotation}deg)`,
                top: '50%',
                left: '50%',
                marginLeft: '-2px',
                marginTop: '-40px',
              }}
            />

            {/* Minute Hand */}
            <div
              className="absolute w-1 h-48 bg-gray-600 rounded-full origin-bottom"
              style={{
                transform: `rotate(${minutesRotation}deg) scaleY(0.35)`,
                top: '50%',
                left: '50%',
                marginLeft: '-2px',
                marginTop: '-48px',
              }}
            />

            {/* Second Hand */}
            <div
              className="absolute w-0.5 h-48 bg-red-500 origin-bottom"
              style={{
                transform: `rotate(${secondsRotation}deg) scaleY(0.35)`,
                top: '50%',
                left: '50%',
                marginLeft: '-1px',
                marginTop: '-48px',
              }}
            />
          </div>
        </div>

        {/* Digital Display */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-800 font-mono tracking-wider mb-2">
            {clock.time}
          </div>
          <div className="text-sm text-gray-600 font-mono">
            {clock.date}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiClock size={32} className="text-blue-500" />
          Reloj Mundial
        </h1>
        <p className="text-gray-600 mt-2">
          Hora actual en diferentes zonas horarias {clocks.length > 0 && `(${clocks[0].date})`}
        </p>
      </div>

      {/* Clocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clocks.map((clock) => (
          <ClockCard key={clock.timezone} clock={clock} />
        ))}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
        <h2 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h2>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Las manecillas se actualizan automáticamente cada segundo</li>
          <li>• Los horarios reflejan cambios de horario de verano/invierno automáticamente</li>
          <li>• Haz clic en cualquier zona para copiar la hora</li>
          <li>• Usa este reloj para coordinar actividades logísticas internacionales</li>
        </ul>
      </div>
    </div>
  );
};

export default WorldClock;
