import * as React from 'react';
import Tooltip from '@mui/material/Tooltip';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import NewSessionIcon from '@mui/icons-material/History';
import {SelectAgentButtonIconMenu} from '../SelectAgentDropdown';
import {SelectModelButtonIconMenu} from '../SelectModelDropdown';
import styles from '../../styles/Home.module.css';

const TopNavBar = ({resetSession, agent, setAgent, model, setModel}) => {
    const isMobile = useMediaQuery('(max-width: 600px)');
    return (
        <Box
            sx={{flexGrow: 1}}
            className={styles.topnav}
        >
            <AppBar position="static">
                <Toolbar>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{flexGrow: 1}}
                    >
                        Autohost Chat
                    </Typography>
                    {(agent && setAgent) && (
                        <Tooltip title="Select Agent">
                            <SelectAgentButtonIconMenu
                                currentAgent={agent}
                                onChange={setAgent}
                                className={styles.agentDropdown}
                            />
                        </Tooltip>
                    )}
                    {(model && setModel) && (
                        <Tooltip title="Select Model">
                            <SelectModelButtonIconMenu
                                currentModel={model}
                                onChange={setModel}
                                className={styles.agentDropdown}
                            />
                        </Tooltip>
                    )}
                    {(resetSession && !isMobile) && (
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={resetSession}
                        >
                            New Session
                        </Button>
                    )}
                    {(resetSession && isMobile) && (
                        <Tooltip title="New Session">
                            <IconButton
                                onClick={resetSession}
                            >
                                <NewSessionIcon/>
                            </IconButton>
                        </Tooltip>
                    )}
                </Toolbar>
            </AppBar>
        </Box>
    );
};

export default TopNavBar;