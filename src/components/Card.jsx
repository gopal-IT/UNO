import React from 'react';
import './Card.css';

export const Card = ({ card, hidden, onClick, style, disabled }) => {
    if (hidden) {
        return (
            <div className="uno-card hidden" style={style}>
                <div className="card-inner-bg">
                    <div className="card-inner">
                        <span className="uno-logo">UNO</span>
                    </div>
                </div>
            </div>
        );
    }

    const { color, type, value } = card;

    let displayLabel = value !== null ? value : type;
    if (type === 'skip') displayLabel = '⊘';
    if (type === 'reverse') displayLabel = '⇄';
    if (type === 'draw2') displayLabel = '+2';
    if (type === 'wild') displayLabel = 'W';
    if (type === 'wild4') displayLabel = '+4';

    let colorClass = `color-${color}`;

    return (
        <div
            className={`uno-card ${colorClass} ${type} ${disabled ? 'disabled' : ''}`}
            onClick={disabled ? null : onClick}
            style={style}
        >
            <div className="card-corner top-left">{displayLabel}</div>
            <div className="card-center">
                <span>{displayLabel}</span>
            </div>
            <div className="card-corner bottom-right">{displayLabel}</div>
        </div>
    );
}
