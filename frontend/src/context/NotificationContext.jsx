import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

const NotificationContext = createContext(null)

export function NotificationProvider({ children, userRole }) {
    const [counts, setCounts] = useState({
        notices: 0,
        govUpdates: 0,
        unpaidTax: 0,
    })

    const fetchCounts = useCallback(async () => {
        if (userRole !== 'user') return
        try {
            const [noticesRes, updatesRes, taxRes] = await Promise.allSettled([
                api.get('taxpayers/notices'),
                api.get('taxpayers/gov-updates'),
                api.get('taxpayers/monthly-taxes'),
            ])

            // Unread notices: count those not marked as read
            let noticesCount = 0
            if (noticesRes.status === 'fulfilled' && noticesRes.value.data.success) {
                const notices = noticesRes.value.data.notices || []
                noticesCount = notices.filter(n => !n.is_read).length
            }

            // Unread gov updates: use localStorage to track last seen
            let updatesCount = 0
            if (updatesRes.status === 'fulfilled' && updatesRes.value.data.success) {
                const updates = updatesRes.value.data.updates || []
                const lastSeen = localStorage.getItem('lastSeenGovUpdates')
                if (lastSeen) {
                    updatesCount = updates.filter(u => new Date(u.created_at) > new Date(lastSeen)).length
                } else {
                    updatesCount = updates.length
                }
            }

            // Unpaid tax: count pending months
            let unpaidCount = 0
            if (taxRes.status === 'fulfilled' && taxRes.value.data.success) {
                const taxes = taxRes.value.data.monthlyTaxes || []
                unpaidCount = taxes.filter(t => t.status === 'pending' || t.status === 'overdue').length
            }

            setCounts({ notices: noticesCount, govUpdates: updatesCount, unpaidTax: unpaidCount })
        } catch (err) {
            // silently fail - notifications are not critical
        }
    }, [userRole])

    useEffect(() => {
        fetchCounts()
        // Refresh every 2 minutes
        const interval = setInterval(fetchCounts, 2 * 60 * 1000)
        return () => clearInterval(interval)
    }, [fetchCounts])

    const markGovUpdatesRead = () => {
        localStorage.setItem('lastSeenGovUpdates', new Date().toISOString())
        setCounts(prev => ({ ...prev, govUpdates: 0 }))
    }

    const markNoticesRead = () => {
        setCounts(prev => ({ ...prev, notices: 0 }))
    }

    const markUnpaidRead = () => {
        setCounts(prev => ({ ...prev, unpaidTax: 0 }))
    }

    return (
        <NotificationContext.Provider value={{ counts, markGovUpdatesRead, markNoticesRead, markUnpaidRead, refetch: fetchCounts }}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    return useContext(NotificationContext)
}
