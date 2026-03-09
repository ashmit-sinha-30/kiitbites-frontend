"use client";

import { useEffect } from 'react';
import { initCSRF } from '@/utils/apiUtils';

export default function CSRFInitializer() {
    useEffect(() => {
        initCSRF();
    }, []);

    return null;
}
