import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Users, Check, ArrowRight, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Table } from "../types";
import Tabletop3DViewer from "./Tabletop3DViewer";

interface SmartBookingBridgeProps {
  tables: Table[];
  selectedRoom: "main" | "vip" | "terrace";
  selectedTable: Table | null;
  setSelectedTable: (table: Table | null) => void;
  selectedTables: Table[];
  setSelectedTables: (tables: Table[]) => void;
  bookedTableIds: string[];
  partySizeFilter: number;
  tableTypeFilter: string;
  tableSearchQuery: string;
  isEditable: boolean;
  onUpdateTables: (updatedTables: Table[]) => void;
  guestsCount: number;
  setGuestsCount: (count: number) => void;
  onBookTable: () => void;
  tableActionLoading: boolean;
}

export default function SmartBookingBridge({
  tables,
  selectedRoom,
  selectedTable,
  setSelectedTable,
  selectedTables,
  setSelectedTables,
  bookedTableIds,
  partySizeFilter,
  tableTypeFilter,
  tableSearchQuery,
  isEditable,
  onUpdateTables,
  guestsCount,
  setGuestsCount,
  onBookTable,
  tableActionLoading
}: SmartBookingBridgeProps) {
  const { t, i18n } = useTranslation();

  // State hook explicitly named currentlySelectedTable
  const [currentlySelectedTable, setCurrentlySelectedTable] = useState<string | null>(null);

  // Filter available tables in the active room
  const availableRoomTables = useMemo(() => {
    return tables.filter(t => t.room === selectedRoom && !bookedTableIds.includes(t.id));
  }, [tables, selectedRoom, bookedTableIds]);

  // Track the last active filter parameters to detect user changes vs programatic updates
  const lastFiltersRef = useRef({
    guestsCount: -1,
    selectedRoom: "" as typeof selectedRoom,
    tableTypeFilter: ""
  });

  // Flag to bypass the auto-allocation engine when the user manually clicks/swaps a table
  const bypassAutoSelectRef = useRef(false);

  // 1. Pre-Filter and Auto-Selection Engine
  // Find the optimal available table that matches or safely exceeds the guest count
  useEffect(() => {
    if (isEditable) return; // Skip auto-allocation during editor mode

    if (bypassAutoSelectRef.current) {
      // Consume the bypass flag
      bypassAutoSelectRef.current = false;
      // Synchronize the filter cache so we don't trigger on subsequent renders
      lastFiltersRef.current = {
        guestsCount,
        selectedRoom,
        tableTypeFilter
      };
      return;
    }

    // Check if the actual user filters have changed
    const filtersChanged = 
      lastFiltersRef.current.guestsCount !== guestsCount ||
      lastFiltersRef.current.selectedRoom !== selectedRoom ||
      lastFiltersRef.current.tableTypeFilter !== tableTypeFilter;

    if (!filtersChanged && currentlySelectedTable !== null) {
      // If the filters haven't changed, do not overwrite the user's manual selection!
      return;
    }

    lastFiltersRef.current = {
      guestsCount,
      selectedRoom,
      tableTypeFilter
    };

    const candidateTables = availableRoomTables.filter(
      table => (tableTypeFilter === "all" || table.type === tableTypeFilter)
    );

    if (candidateTables.length === 0) {
      // Clear selection if no tables available
      setCurrentlySelectedTable(null);
      setSelectedTable(null);
      setSelectedTables([]);
      return;
    }

    // Try to find the optimal table where capacity >= guestsCount
    // We sort such that we find the closest capacity match to prevent putting 2 guests at a 10-person table if a 2-person table is free
    const perfectFits = candidateTables
      .filter(table => table.capacity >= guestsCount)
      .sort((a, b) => a.capacity - b.capacity || a.number - b.number);

    let optimalTable: Table | null = null;

    if (perfectFits.length > 0) {
      optimalTable = perfectFits[0];
    } else {
      // If no table can fit the requested guestsCount, pick the one with the highest capacity
      const bestAvailable = candidateTables.sort((a, b) => b.capacity - a.capacity);
      optimalTable = bestAvailable[0];
    }

    if (optimalTable) {
      setCurrentlySelectedTable(optimalTable.id);
      setSelectedTable(optimalTable);
      setSelectedTables([optimalTable]);
    }
  }, [guestsCount, selectedRoom, tables, bookedTableIds, tableTypeFilter, isEditable, availableRoomTables, currentlySelectedTable, setSelectedTable, setSelectedTables]);

  // Keep state hook in sync with parents if selection changes via list clicking
  useEffect(() => {
    if (selectedTable) {
      setCurrentlySelectedTable(selectedTable.id);
    } else {
      setCurrentlySelectedTable(null);
    }
  }, [selectedTable]);

  // 2. The 1-Click Swap Rule (No Hassle Multi-Selection)
  const handleTableSelectSwap = React.useCallback((table: Table) => {
    const isBooked = bookedTableIds.includes(table.id);
    if (isBooked) return;

    // Set the bypass flag so the auto-allocator knows this change came from a direct user click
    bypassAutoSelectRef.current = true;

    // Strict 1-for-1 replacement: clear previous, assign new
    setCurrentlySelectedTable(table.id);
    setSelectedTable(table);
    setSelectedTables([table]);

    // Automatically adjust guests count if it exceeds the new table's capacity
    if (guestsCount > table.capacity) {
      setGuestsCount(table.capacity);
      toast.info(
        i18n.language === "ru"
          ? `Размер группы изменен до ${table.capacity} чел. (макс. вместимость стола №${table.number})`
          : `Group size adjusted to ${table.capacity} (max capacity of Table #${table.number})`
      );
    }
  }, [bookedTableIds, guestsCount, i18n.language, setGuestsCount, setSelectedTable, setSelectedTables]);

  // Find currently selected table object to render info in overlay banner
  const selectedTableObj = useMemo(() => {
    return tables.find(t => t.id === currentlySelectedTable);
  }, [tables, currentlySelectedTable]);

  // Translations helper for the contextual overlay banner
  const bannerText = useMemo(() => {
    if (!selectedTableObj) return "";
    
    if (i18n.language === "ru") {
      return `Столик №${selectedTableObj.number} автоматически выбран для вашей группы из ${guestsCount} чел. Нажмите на любой другой свободный столик для изменения.`;
    } else if (i18n.language === "ar") {
      return `تم اختيار الطاولة رقم ${selectedTableObj.number} تلقائياً لمجموعتك المكونة من ${guestsCount} أشخاص. اضغط على أي طاولة شاغرة أخرى للتغيير.`;
    } else if (i18n.language === "hy") {
      return `Սեղան №${selectedTableObj.number}-ը ավտոմատ կերպով ընտրվել է ձեր ${guestsCount} հոգանոց խմբի համար: Փոխելու համար սեղմեք ցանկացած այլ ազատ սեղանի:`;
    }
    return `Table #${selectedTableObj.number} has been chosen for your group of ${guestsCount}. Tap another open table to change.`;
  }, [selectedTableObj, guestsCount, i18n.language]);

  // Memoize the 3D Viewer to bypass any re-renders triggered by parent state changes that don't affect floor-plan props
  const memoized3DViewer = useMemo(() => {
    return (
      <Tabletop3DViewer
        tables={tables}
        selectedRoom={selectedRoom}
        selectedTable={selectedTable}
        selectedTables={selectedTables}
        onSelectTable={handleTableSelectSwap}
        bookedTableIds={bookedTableIds}
        partySizeFilter={partySizeFilter}
        tableTypeFilter={tableTypeFilter}
        tableSearchQuery={tableSearchQuery}
        isEditable={isEditable}
        onUpdateTables={onUpdateTables}
      />
    );
  }, [
    tables,
    selectedRoom,
    selectedTable,
    selectedTables,
    handleTableSelectSwap,
    bookedTableIds,
    partySizeFilter,
    tableTypeFilter,
    tableSearchQuery,
    isEditable,
    onUpdateTables
  ]);

  return (
    <div className="w-full h-full relative" id="smart-booking-bridge-container">
      {/* 3D Map canvas */}
      {memoized3DViewer}

      {/* 3. Contextual Confirmation UI Layer (Floating Overlay Banner) */}
      <AnimatePresence>
        {selectedTableObj && !isEditable && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-6 left-6 right-6 z-30 bg-[#0F1115]/90 backdrop-blur-md border border-teal-500/30 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl shadow-black/80 shadow-teal-500/5 overflow-hidden"
            id="smart-booking-contextual-banner"
          >
            {/* Top glass highlights & pulsing radar indicator */}
            <div className="absolute top-0 left-0 w-2 h-full bg-teal-500" />
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3.5 z-10">
              <div className="relative shrink-0 flex items-center justify-center w-11 h-11 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
                <span className="absolute inset-0 rounded-xl bg-teal-500/20 animate-ping opacity-60" style={{ animationDuration: "1.8s" }} />
                <Sparkles className="w-5 h-5 text-teal-400" />
              </div>
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/15 px-2 py-0.5 rounded">
                    {i18n.language === "ru" ? "Умный подбор" : i18n.language === "hy" ? "Խելացի ընտրություն" : "Smart Selection"}
                  </span>
                  <span className="text-[11px] text-white/50 font-mono font-bold flex items-center gap-1">
                    <Users className="w-3 h-3 text-amber-400" />
                    {guestsCount} {i18n.language === "ru" ? "мест" : i18n.language === "hy" ? "տեղ" : "guests"} ({i18n.language === "ru" ? `макс. ${selectedTableObj.capacity}` : i18n.language === "hy" ? `առավելագույնը ${selectedTableObj.capacity}` : `max ${selectedTableObj.capacity}`})
                  </span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed font-sans max-w-[500px]">
                  {bannerText}
                </p>
              </div>
            </div>

            <div className="w-full md:w-auto shrink-0 z-10 flex items-center gap-3">
              {/* Optional Quick Swap Info Badge */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] text-white/40 font-mono">
                <HelpCircle className="w-3.5 h-3.5 text-white/30" />
                <span>{i18n.language === "ru" ? "1 Клик Смена" : i18n.language === "hy" ? "1-Կտտոցով Փոխում" : "1-Click Swap"}</span>
              </div>

              <button
                type="button"
                onClick={onBookTable}
                disabled={tableActionLoading}
                className="w-full md:w-auto py-3 px-6 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-black text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
                id="smart-booking-confirm-btn"
              >
                {tableActionLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>
                  {tableActionLoading
                    ? (i18n.language === "ru" ? "Оформление..." : i18n.language === "hy" ? "Ձևակերպում..." : "Processing...")
                    : (i18n.language === "ru" ? "Подтвердить столик" : i18n.language === "hy" ? "Հաստատել սեղանը" : "Confirm Reservation")}
                </span>
                {!tableActionLoading && <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
