import React from 'react';
import { GlassCard } from './GlassCard';

interface Column<T> {
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

interface ResourceTableProps<T> {
  title?: string;
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
}

/**
 * ResourceTable: A high-performance, cinematic table for managing registry entities.
 * Migrated to Vanilla CSS (HQ System).
 */
export function ResourceTable<T extends { id: string | number }>({ 
  title, 
  data, 
  columns,
  onRowClick 
}: ResourceTableProps<T>) {
  return (
    <GlassCard className="overflow-hidden" style={{ borderRadius: '2rem' }}>
      {title && (
        <header className="hq-p-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <h3 className="hq-text-lg hq-font-black hq-text-white hq-tracking-tighter">{title}</h3>
        </header>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table className="hq-resource-table">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className="hq-p-6 hq-text-xs hq-font-black hq-text-dim hq-uppercase hq-tracking-widest"
                  style={{ textAlign: 'left' }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr 
                key={item.id} 
                onClick={() => onRowClick?.(item)}
                className="hq-table-row"
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col, j) => (
                  <td key={j} className="hq-table-cell">
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ padding: '5rem', textAlign: 'center' }}>
                  <p className="hq-text-dim hq-text-xs hq-font-black hq-uppercase hq-tracking-widest" style={{ opacity: 0.4 }}>
                    No entities detected in this sector
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
