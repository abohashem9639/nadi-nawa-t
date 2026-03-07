'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import countryCodes from 'country-codes-list';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const countriesArray = Object.values(countryCodes.customList('countryCode', '{countryNameEn}|{countryCallingCode}'))
    .map(c => {
        const [name, code] = c.split('|');
        return { name, code: '+' + code };
    })
    // Remove duplicates and sort, ensuring Turkey is first in common or default
    .reduce((acc, curr) => {
        if (!acc.find(item => item.name === curr.name && item.code === curr.code)) {
            acc.push(curr);
        }
        return acc;
    }, []);

countriesArray.sort((a, b) => a.name.localeCompare(b.name));

// Extract Turkey to top
const turkeyIndex = countriesArray.findIndex(c => c.name === 'Turkey');
let allCountries = [...countriesArray];
if (turkeyIndex > -1) {
    const turkey = allCountries.splice(turkeyIndex, 1)[0];
    allCountries.unshift(turkey);
}

export default function PhoneInput({ value, onChange, placeholder }) {
    const { t, isRtl } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCode, setSelectedCode] = useState('+90'); // default turkey
    const [number, setNumber] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        // parse intial value if provided
        if (value && value.startsWith('+')) {
            // we could parse the code, but for simplicity we rely on onChange sending back the combined string
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCountries = useMemo(() => {
        if (!search) return allCountries;
        const lowerSearch = search.toLowerCase();
        return allCountries.filter(c =>
            c.name.toLowerCase().includes(lowerSearch) ||
            c.code.includes(lowerSearch)
        );
    }, [search]);

    const handleCodeSelect = (code) => {
        setSelectedCode(code);
        setIsOpen(false);
        setSearch('');
        onChange(code + number);
    };

    const handleNumberChange = (e) => {
        // allow only numbers
        const val = e.target.value.replace(/\D/g, '');
        setNumber(val);
        onChange(selectedCode + val);
    };

    return (
        <div className="phone-input-container" style={{ position: 'relative', display: 'flex', gap: '8px', zIndex: 10 }} dir="ltr" ref={containerRef}>
            {/* Country Dropdown Toggle */}
            <div style={{ position: 'relative' }}>
                <button
                    type="button"
                    className="form-input"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '10px 12px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        color: 'var(--text-primary)'
                    }}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span style={{ minWidth: '35px', textAlign: 'left' }}>{selectedCode}</span>
                    <ChevronDown size={14} className="text-muted" />
                </button>

                {/* Dropdown List */}
                {isOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '4px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        width: '240px',
                        maxHeight: '300px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder={isRtl ? 'بحث...' : 'Search...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '6px 8px 6px 28px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    background: 'var(--bg)',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    fontSize: '0.85rem'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto', flex: 1 }}>
                            {filteredCountries.map((c, i) => (
                                <li
                                    key={i}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderBottom: i < filteredCountries.length - 1 ? '1px solid var(--border-color)' : 'none',
                                        background: selectedCode === c.code ? 'var(--brand-medium-10)' : 'transparent'
                                    }}
                                    onClick={() => handleCodeSelect(c.code)}
                                >
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{c.name}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.code}</span>
                                </li>
                            ))}
                            {filteredCountries.length === 0 && (
                                <li style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {isRtl ? 'لا توجد نتائج' : 'No results found'}
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>

            {/* Phone Number Input */}
            <input
                type="tel"
                className="form-input"
                style={{ flex: 1, color: 'var(--text-primary)' }}
                placeholder={placeholder}
                value={number}
                onChange={handleNumberChange}
                dir="ltr"
            />
        </div>
    );
}
