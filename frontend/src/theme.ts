import { createTheme, type ThemeOptions } from "@mui/material/styles";

const shadows = [
  "none",
  "rgba(0, 0, 0, 0.02) 0px 0px 0px 1px",
  "rgba(0, 0, 0, 0.02) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 2px 6px, rgba(0, 0, 0, 0.06) 0px 4px 8px",
  "rgba(0, 0, 0, 0.02) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 4px 12px",
  "rgba(0, 0, 0, 0.08) 0px 8px 24px",
  "rgba(0, 0, 0, 0.12) 0px 16px 48px",
  ...Array(19).fill("rgba(0, 0, 0, 0.12) 0px 16px 48px"),
] as unknown as ThemeOptions["shadows"];

const themeOptions: ThemeOptions = {
  palette: {
    mode: "light",
    primary: {
      main: "#e11d48",
      light: "#fb7185",
      dark: "#be123c",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#52525b",
      light: "#71717a",
      dark: "#3f3f46",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    info: {
      main: "#0ea5e9",
      light: "#38bdf8",
      dark: "#0284c7",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    background: {
      default: "#fafaf9",
      paper: "#ffffff",
    },
    text: {
      primary: "#18181b",
      secondary: "#71717a",
      tertiary: "#a1a1aa",
    } as ThemeOptions["palette"] extends { text: infer T } ? T : never,
    divider: "rgba(0, 0, 0, 0.06)",
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"SF Pro Text"',
      '"SF Pro Display"',
      '"Segoe UI"',
      "Roboto",
      '"PingFang SC"',
      '"Microsoft YaHei"',
      "sans-serif",
    ].join(","),
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: { fontWeight: 600, fontSize: "3rem", lineHeight: 1.1, letterSpacing: "-0.025em" },
    h2: { fontWeight: 600, fontSize: "2.25rem", lineHeight: 1.15, letterSpacing: "-0.02em" },
    h3: { fontWeight: 600, fontSize: "1.5rem", lineHeight: 1.25, letterSpacing: "-0.015em" },
    h4: { fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.3, letterSpacing: "-0.01em" },
    h5: { fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.35, letterSpacing: "-0.005em" },
    h6: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.4, letterSpacing: "-0.005em" },
    subtitle1: { fontWeight: 500, fontSize: "1rem", lineHeight: 1.5, letterSpacing: "-0.01em" },
    subtitle2: { fontWeight: 500, fontSize: "0.875rem", lineHeight: 1.5, letterSpacing: "-0.005em" },
    body1: { fontWeight: 400, fontSize: "1rem", lineHeight: 1.6, letterSpacing: "-0.01em" },
    body2: { fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.6, letterSpacing: "-0.005em" },
    button: { fontWeight: 500, fontSize: "0.9375rem", letterSpacing: "-0.01em", textTransform: "none" },
    caption: { fontWeight: 400, fontSize: "0.75rem", lineHeight: 1.5, letterSpacing: "0" },
    overline: { fontWeight: 500, fontSize: "0.75rem", lineHeight: 1.5, letterSpacing: "0.05em", textTransform: "uppercase" },
  },
  shape: {
    borderRadius: 12,
  },
  shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#fafaf9",
          color: "#18181b",
          letterSpacing: "-0.01em",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 10,
          padding: "12px 24px",
          fontWeight: 500,
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        contained: {
          backgroundColor: "#e11d48",
          color: "#ffffff",
          boxShadow: "rgba(0, 0, 0, 0.04) 0px 2px 6px",
          "&:hover": {
            backgroundColor: "#be123c",
            boxShadow: "rgba(0, 0, 0, 0.08) 0px 4px 12px",
            transform: "translateY(-1px)",
          },
        },
        outlined: {
          borderColor: "rgba(0, 0, 0, 0.12)",
          color: "#18181b",
          backgroundColor: "#ffffff",
          "&:hover": {
            backgroundColor: "#fafaf9",
            borderColor: "rgba(0, 0, 0, 0.2)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "rgba(0, 0, 0, 0.02) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 2px 6px, rgba(0, 0, 0, 0.06) 0px 4px 8px",
          borderRadius: 16,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: "none",
          borderRadius: 16,
          boxShadow: "rgba(0, 0, 0, 0.02) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 2px 6px, rgba(0, 0, 0, 0.06) 0px 4px 8px",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "rgba(0, 0, 0, 0.06) 0px 4px 12px",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            backgroundColor: "#ffffff",
            transition: "all 0.2s ease",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(0, 0, 0, 0.1)",
              borderWidth: 1,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(0, 0, 0, 0.2)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#e11d48",
              borderWidth: 2,
              boxShadow: "0 0 0 4px rgba(225, 29, 72, 0.1)",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: "0.8125rem",
          height: 32,
          transition: "all 0.15s ease",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          backgroundColor: "#e11d48",
          height: 2.5,
          borderRadius: "2px 2px 0 0",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.9375rem",
          minHeight: 48,
          color: "#71717a",
          transition: "color 0.2s ease",
          "&.Mui-selected": {
            color: "#e11d48",
            fontWeight: 600,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: "0.8125rem",
          fontWeight: 500,
          backgroundColor: "#18181b",
          padding: "8px 12px",
          boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 12px",
        },
        arrow: {
          color: "#18181b",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(0, 0, 0, 0.06)",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: "all 0.15s ease",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.05)",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: "none",
          boxShadow: "rgba(0, 0, 0, 0.04) 0px 2px 8px",
        },
        colorWarning: {
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          color: "#92400e",
        },
        colorError: {
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          color: "#991b1b",
        },
        colorSuccess: {
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          color: "#065f46",
        },
        colorInfo: {
          backgroundColor: "rgba(14, 165, 233, 0.1)",
          color: "#0c4a6e",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: "rgba(0, 0, 0, 0.12) 0px 24px 60px",
        },
      },
    },
  },
};

const theme = createTheme(themeOptions);

export default theme;
