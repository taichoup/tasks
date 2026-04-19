import { useState, useRef } from "react";
import styles from "./DateCheckbox.module.css";
import { toLocalDateString, dateInputToIso } from "../utils/dateUtils";

interface DateCheckboxProps {
  checked: boolean;
  onChange: (checkedAt?: string) => void;
  disabled?: boolean;
}

export const DateCheckbox = ({ checked, onChange, disabled }: DateCheckboxProps) => {
  const today = toLocalDateString(new Date());
  const [showPopover, setShowPopover] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPopover = () => {
    setSelectedDate(today);
    setShowPopover(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (checked) return;
    e.preventDefault();
    openPopover();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (checked) return;
    e.preventDefault();
    longPressTimer.current = setTimeout(openPopover, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleConfirm = () => {
    onChange(dateInputToIso(selectedDate));
    setShowPopover(false);
  };

  return (
    <div className={styles.wrapper}>
      <input
        className={styles.checkbox}
        type="checkbox"
        checked={checked}
        onChange={() => onChange()}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        disabled={disabled}
        title={!checked ? "Clic droit pour marquer à une date passée" : undefined}
      />
      {showPopover && (
        <>
          <div className={styles.overlay} onClick={() => setShowPopover(false)} />
          <div className={styles.popover}>
            <label className={styles.popoverLabel}>
              Fait le
              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </label>
            <div className={styles.popoverActions}>
              <button onClick={() => setShowPopover(false)}>Annuler</button>
              <button
                className={styles.popoverConfirm}
                onClick={handleConfirm}
                disabled={!selectedDate}
              >
                Confirmer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
