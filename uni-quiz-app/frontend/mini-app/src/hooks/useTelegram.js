import { useEffect, useState, useMemo } from 'react'

/**
 * Hook to interact with Telegram WebApp
 */
export function useTelegram() {
    const [isReady, setIsReady] = useState(false)

    const tg = useMemo(() => window.Telegram?.WebApp, [])

    useEffect(() => {
        if (tg) {
            // Expand the mini app
            tg.expand()

            // Set header color
            tg.setHeaderColor('secondary_bg_color')

            // Enable closing confirmation
            tg.enableClosingConfirmation()

            setIsReady(true)
        } else {
            // Development mode without Telegram
            setIsReady(true)
        }
    }, [tg])

    const user = useMemo(() => {
        if (tg?.initDataUnsafe?.user) {
            return tg.initDataUnsafe.user
        }
        // Mock user for development
        return {
            id: 123456789,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser'
        }
    }, [tg])

    const initData = useMemo(() => {
        return tg?.initData || ''
    }, [tg])

    // Show/hide main button
    const showMainButton = (text, onClick) => {
        if (tg?.MainButton) {
            tg.MainButton.setText(text)
            tg.MainButton.onClick(onClick)
            tg.MainButton.show()
        }
    }

    const hideMainButton = () => {
        if (tg?.MainButton) {
            tg.MainButton.hide()
        }
    }

    // Show/hide back button
    const showBackButton = (onClick) => {
        if (tg?.BackButton) {
            tg.BackButton.onClick(onClick)
            tg.BackButton.show()
        }
    }

    const hideBackButton = () => {
        if (tg?.BackButton) {
            tg.BackButton.hide()
        }
    }

    // Haptic feedback
    const haptic = {
        impact: (style = 'medium') => tg?.HapticFeedback?.impactOccurred?.(style),
        notification: (type = 'success') => tg?.HapticFeedback?.notificationOccurred?.(type),
        selection: () => tg?.HapticFeedback?.selectionChanged?.(),
    }

    // Close the app
    const close = () => {
        if (tg) {
            tg.close()
        }
    }

    return {
        tg,
        user,
        initData,
        isReady,
        showMainButton,
        hideMainButton,
        showBackButton,
        hideBackButton,
        haptic,
        close,
    }
}
