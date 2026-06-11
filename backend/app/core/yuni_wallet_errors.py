"""YuniMonnaie domain exceptions (PASSPORT-02A)."""


class YuniWalletError(Exception):
    """Base error for YuniMonnaie wallet operations."""


class YuniWalletSuspendedError(YuniWalletError):
    """Wallet is suspended — earn and spend are blocked."""


class YuniWalletInsufficientBalanceError(YuniWalletError):
    """Spend rejected because balance is too low."""


class YuniWalletInvalidAmountError(YuniWalletError):
    """Amount must be strictly positive."""


class YuniWalletInvalidReferenceTypeError(YuniWalletError):
    """Reference type is not in the MVP allowlist."""


class YuniWalletTransactionNotFoundError(YuniWalletError):
    """Referenced ledger transaction was not found."""


class YuniWalletInvalidReversalError(YuniWalletError):
    """Reversal rejected — wrong type, already reversed, or invalid target."""
