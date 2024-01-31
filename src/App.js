import React, { useState, useEffect } from 'react';
import './App.css';

// Axios
import axios from 'axios';

// Material UI
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import Item from '@mui/material/Grid';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';

import ButuanMap from './Map';

// ChartJS
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Legend,
  ArcElement,
  Tooltip
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Legend,
  ArcElement,
  Tooltip,
)
Chart.defaults.color = '#000000';

// MUI dark theme and typography of montserrat
const darkTheme = createTheme({
  typography: {
    "fontFamily": `"Montserrat", "Helvetica", "Arial", sans-serif`,
    "fontSize": 14,
    "fontWeightLight": 300,
    "fontWeightRegular": 400,
    "fontWeightMedium": 500,
    "fontWeightSemiBold": 600,
    "fontWeightBold": 700,
    "fontWeightExtraBold": 800,
    "fontWeightBlack": 900
  },
  palette: {
    mode: 'dark',
  }
});

const backend_url = 'http://127.0.0.1:8000';

// Crime colors
const crimeColor = {
  'murder': ['0', '100%', '50%'],
  'homicide': ['30', '100%', '50%'],
  'physical injury': ['60', '100%', '50%'],
  'rape': ['120', '100%', '50%'],
  'robbery': ['240', '100%', '50%'],
  'theft': ['275', '100%', '25%'],
  'carnapping': ['275', '100%', '50%']
}

export default function App() {
  // Dynamic list of barangays and crimes by fetching via the backend API
  const [barangays, setBarangays] = useState([]);
  const [crimes, setCrimes] = useState([]);

  /**
   * Get the current list of barangays from the backend database and
   * store it inside the barangays variable
   */
  useEffect(() => {
    axios
    .get(`${backend_url}/barangays`)
    .then(response => {
      setBarangays(response.data.barangays);
    })
    .catch(error => {
      console.log(error);
    })
  }, []);

  /**
   * Get the current list of crimes from the backend database and
   * store it inside the crimes variable
   */
  useEffect(() => {
    axios
    .get(`${backend_url}/crimes`)
    .then(response => {
      setCrimes(response.data.crimes);
    })
    .catch(error => {
      console.log(error);
    })
  }, [])

  // Barangay and crime buttons
  const [barangay, setBarangay] = useState('');
  const [crime, setCrime] = useState('');

  // Backend API Results
  const [barangayData, setBarangayData] = useState({});
  const [crimeData, setCrimeData] = useState({});
  const [barangayCrimeData, setBarangayCrimeData] = useState({});

  // Data visualizers
  const [mapGrid, setMapGrid] = useState(12);
  const [intensityGrid, setIntensityGrid] = useState(0);
  const [intensityDisplay, setIntensityDisplay] = useState('none');
  const [dataGrid, setDataGrid] = useState(0);
  const [dataDisplay, setDataDisplay] = useState('none');

  // Responsible for checking what type of map display will the website be
  const handleDropdownChange = () => {
    // Checks for the status of the two dropdowns
    const barangay_status = barangay.length > 1;
    const crime_status = crime.length > 1;

    // If both dropdowns are active
    if (barangay_status && crime_status) {
      // Show less of map grid and more of data grid and hide intensity grid set the data's display block
      setMapGrid(6);
      setIntensityGrid(0);
      setIntensityDisplay('none');
      setDataGrid(6);
      setDataDisplay('block');
      barangayViewer(barangay);

      axios
      .get(`${backend_url}/barangay_crime/${barangay}/${crime}`)
      .then(response => {
        setBarangayCrimeData(response.data);
      })
      .catch(error => {
        console.log(error);

        clearHeatMap();
        setBarangayCrimeData({'error': 'Data for crime inside barangay is not found'});
        setDataType('barangayCrime');
      })
    // If only the barangay dropdown is active
    } else if (barangay_status) {
      // Equally show map grid and data grid and set the data's display to block
      setMapGrid(6);
      setDataGrid(6);
      setDataDisplay('block');

      axios
      .get(`${backend_url}/barangay/${barangay}`)
      .then(response => {
        setBarangayData(response.data);
      })
      .catch(error => {
        console.log(error);
      })
    // If only the crime dropdown is active
    } else if (crime_status) {
      // Show map grid, intensity bar, and data      
      setMapGrid(5);
      setIntensityGrid(2);
      setIntensityDisplay('flex');
      setDataGrid(5);
      setDataDisplay('block');

      axios
      .get(`${backend_url}/crime/${crime}`)
      .then(response => {
        setCrimeData(response.data);
      })
      .catch(error => {
        console.log(error);
      })
    }
  };

  /**
   * Runs this function whenever the value of the barangay
   * and crime variable has changed
   */
  useEffect(handleDropdownChange, [barangay, crime]);

  const [dataType, setDataType] = useState("");

  /**
   * Set the type of data showcase in data visualizer
   * if the data of barangayData has updated
   */
  useEffect(() => {
    if (Object.keys(barangayData).length) {
      setDataType('barangay');
    }
  }, [barangayData]);

  /**
   * Set the type of data showcase in data visualizer
   * if the data of crimeData has updated
   */
  useEffect(() => {
    if (Object.keys(crimeData).length) {
      setDataType('crime');
    }

    crimeVisualizer(crimeData);
  }, [crimeData]);

  /**
   * Set the type of data showcase in data visualizer
   * if the data of barangayCrimeData has updated
   */
  useEffect(() => {
    if (Object.keys(barangayCrimeData).length) {
      clearHeatMap();
      setDataType(`barangayCrime`);
    }
  }, [barangayCrimeData]);

  // A variable for the previous barangay that was previewed
  const [previousBarangayView, setPreviousBarangayView] = useState('');

  const clearMap = () => {
    document.querySelectorAll('#paths-container > path').forEach(path => {
      path.removeAttribute('class');
      path.removeAttribute('transform-origin');
      path.removeAttribute('transform-box');
      path.removeAttribute('transform');
      path.removeAttribute('style');
    })
  }

  const barangayViewer = (name) => {
    document.querySelectorAll('#paths-container > path').forEach(path => {
      // Makes the previous barangay svg back to default
      if (previousBarangayView !== name && path.id === previousBarangayView) {
        path.removeAttribute('class');
        path.removeAttribute('transform-origin');
        path.removeAttribute('transform-box');
        path.removeAttribute('transform');
        path.removeAttribute('style');
      // Highlights the current barangay svg chosen
      } else if (path.id === name) {
        // Get the current position of the element path
        var bbox = path.getBBox();
        var cx = bbox.x + bbox.width / 2;
        var cy = bbox.y + bbox.height / 2;

        // Make the current barangay path bigger and make its color lighter
        path.setAttribute('class', 'active');
        path.setAttribute('transform-origin', `${cx}px ${cy}px`);
        path.setAttribute('transform-box', 'fill-box');
        path.setAttribute('transform', 'scale(2)');
        path.setAttribute('style', 'fill: #5C8374; filter: drop-shadow(2px 2px 6px rgba(0, 0, 0, 0.5));');
        if (crime) {
          path.setAttribute('style', `fill: hsl(${crimeColor[crime][0]}, ${crimeColor[crime][1]}, ${crimeColor[crime][2]}); filter: drop-shadow(2px 2px 6px rgba(0, 0, 0, 0.5));`);
        }

        path.parentElement.appendChild(path);

        setPreviousBarangayView(name);
      }
    })
  };

  /**
   * Listens for Barangay dropdown changes
   * 
   * Displays the data grid if a barangay is selected,
   * Otherwise, it hides the data grid.
   */
  const handleBarangayChange = (event) => {
    if (!event.target.value) {
      setMapGrid(12);
      setDataGrid(0);
      setDataDisplay('none');
    }

    // Highlight the barangay
    barangayViewer(event.target.value);

    setBarangay(event.target.value);
  };

  const handleCrimeChange = (event) => {
    // Clears the heatmap if the None value of the crime dropdown is selected
    if (!event.target.value) {
      clearHeatMap();
      setMapGrid(12);
      setIntensityGrid(0);
      setIntensityDisplay('none');
      setDataGrid(0);
      setDataDisplay('none');
    }

    setCrime(event.target.value);
  };

  const clear = () => {
    setBarangay('');
    setCrime('');
    clearHeatMap();
    setMapGrid(12);
    setIntensityGrid(0);
    setIntensityDisplay('none');
    setDataGrid(0);
    setDataDisplay('none');
    clearMap();
  }

  return (
    <ThemeProvider theme={darkTheme}>
    <CssBaseline />
      <div className="horizontally-center">
        <h1>
          <a id="butuan-crime-title" href="/#" onClick={clear}>
            <span id="butuan">Butuan</span> <span id="crime">Crime</span>
          </a>
        </h1>
      </div>
      <Container id="dropdown-container" maxWidth="sm">
        <BarangayCrimeDropdown
          barangay={barangay}
          crime={crime}
          barangays={barangays}
          crimes={crimes}
          handleBarangayChange={handleBarangayChange}
          handleCrimeChange={handleCrimeChange}
        />
      </Container>
      <Grid container marginTop={2}>
        <Grid id="map-container" item={true} xs={mapGrid}>
          <Item>
            <ButuanMap />
          </Item>
        </Grid>

        <Grid id="intensity-bar-container" item={true} xs={intensityGrid} sx={{ display: intensityDisplay }}>
          <Item className="fade-in-text">
            <IntensityBar
              crime={crime}
            />
          </Item>
        </Grid>

        <Grid item={true} xs={dataGrid} sx={{ display: dataDisplay }}>
          <Item>
            <DataVisualizer
              barangay={barangay}
              crime={crime}
              dataType={dataType}
              barangayData={barangayData}
              crimeData={crimeData}
              barangayCrimeData={barangayCrimeData}
            />
          </Item>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

function BarangayCrimeDropdown({barangay, crime, barangays, crimes, handleBarangayChange, handleCrimeChange}) {
  return(
    <div className="horizontally-center">
      <FormControl size="small" sx={{ m: 1, width: 1/2 }}>
        <InputLabel>Barangay</InputLabel>
        <Select
          value={barangay}
          onChange={handleBarangayChange}
          label="Barangay"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {barangays.map(barangay => {
            return <MenuItem key={barangay.id} value={barangay.name}>{capitalizeString(barangay.name)}</MenuItem>
          })}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ m: 1, width: 1/2 }}>
        <InputLabel>Crime</InputLabel>
        <Select
          value={crime}
          onChange={handleCrimeChange}
          label="Crime"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {crimes.map((crime_name, index) => {
            return <MenuItem key={index} value={crime_name}>{capitalizeString(crime_name)}</MenuItem>
          })}
        </Select>
      </FormControl>
    </div>
  );
}

function IntensityBar(props) {
  /**
   * Displays the intensity bar of the current crime
   */

  if (!props.crime) {
    return null;
  }

  return(
    <div id="intensity-bar">
      <div>
        <Grid container spacing={1}>
          <Grid item>
            <div 
            id="intensity-high" 
            style={{ backgroundColor: `hsl(${crimeColor[props.crime][0]}, 
              ${crimeColor[props.crime][1]},
              ${(parseInt(crimeColor[props.crime][2].slice(0, 2)) - 20).toString() + '%'})` }}></div>
          </Grid>
          <Grid item sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '15px' }}>
            HIGH
          </Grid>
        </Grid>
      </div>
      <div>
        <Grid container spacing={1}>
          <Grid item>
            <div 
            id="intensity-high"
            style={{ backgroundColor: `hsl(${crimeColor[props.crime][0]}, 
              ${crimeColor[props.crime][1]},
              ${crimeColor[props.crime][2]}` }}></div>
          </Grid>
          <Grid item sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '15px' }}>
            MEDIUM
          </Grid>
        </Grid>
      </div>
      <div>
        <Grid container spacing={1}>
          <Grid item>
            <div 
            id="intensity-high" 
            style={{ backgroundColor: `hsl(${crimeColor[props.crime][0]}, 
              ${crimeColor[props.crime][1]},
              ${(parseInt(crimeColor[props.crime][2].slice(0, 2)) + 20).toString() + '%'})` }}></div>
          </Grid>
          <Grid item sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '15px' }}>
            LOW
          </Grid>
        </Grid>
      </div>
    </div>
  )
}

function DataVisualizer(props) {
  const [bcYear, setBCYear] = useState('');
  const [bcMonths, setBCMonths] = useState({});
  const [bcHours, setBCHours] = useState({});

  useEffect(() => {
    setBCYear('');
    setBCMonths({});
    setBCHours({});
  }, [props.barangay, props.crime])

  const [cYear, setCYear] = useState('');
  const [cMonths, setCMonths] = useState({});
  const [cHours, setCHours] = useState({});

  const [cMax, setCMax] = useState(0);
  const [bcMax, setBCMax] = useState(0);

  useEffect(() => {
    setCYear('');
    setCMonths({});
    setCHours({});
  }, [props.barangay, props.crime]);

  // Display a data visualizer for barangay data
  if (props.dataType === 'barangay') {
    let labels = [];
    let colors = [];

    Object.keys(props.barangayData).slice(1).forEach(data => {
      colors.push(`hsl(${crimeColor[data][0]}, ${crimeColor[data][1]}, ${crimeColor[data][2]})`);
      labels.push(capitalizeString(data));
    });

    return(
      <div>
        <div className="horizontally-center">
          <h2>Barangay {capitalizeString(props.barangay)}</h2>
        </div>
        <div id="piechart-container">
          <div id="piechart">
            <PieChart
              chartData={Object.values(props.barangayData).slice(1)}
              labels={labels}
              colors={colors}
            />
          </div>
        </div>
      </div>
    )
  }
  // Display a data visualizer for crime data
  else if (props.dataType === 'crime') {
    if (!props.crime) {
      return null;
    }

    // Dropdown handler of barangay crime data visualizer
    const handleChartDropdownChange = (event) => {
      // Set the current year chosen in the dropdown
      setCYear(event.target.value);
      // Set the current max of Y axis for the graph
      setCMax(props.crimeData['yearly_totals'][event.target.value]);

      // Set the currentMonths and currentHours dictionary for the chart
      let currentMonths = {};
      let currentHours = {};

      // Set the month names to be displayed in the chart
      const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May.', 'Jun.', 'Jul.', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

      // Append all the month names found in monthNames and insert it inside the currentMonths dictionary
      monthNames.forEach(month => {
        currentMonths[month] = 0;
      })

      // Append all possible hours in a 12-hour format inside  currentHours dictionary
      const meridiem = ['AM', 'PM']

      meridiem.forEach(currentMeridiem => {
        let firstHour = 12;
        currentHours[firstHour.toString() + ' ' + currentMeridiem] = 0;

        for (let hour = 1; hour < 12; hour++) {
          currentHours[hour.toString() + ' ' + currentMeridiem] = 0;
        }
      })

      // Iterate over every date occurrences found in the crime's data
      props.crimeData.datetime.forEach(dt => {
        // Classify the current datetime string as a date
        let dtString = new Date(dt);

        // Get the current year, month, and hour of the date
        let currentYear = dtString.toLocaleString('default', {year: 'numeric'});
        let currentMonth = dtString.toLocaleString('default', {month: 'long'}).slice(0, 3) + ".";
        let currentHour = dtString.toLocaleString('default', {hour: 'numeric', hour12: true});

        // If the current year is equal to the year chosen in the dropdown
        if (currentYear === event.target.value) {
          // Append the current hour to the currentHours dictionary
          if (currentHours[currentHour]) {
            currentHours[currentHour] += 1;
          } else {
            currentHours[currentHour] = 1;
          }

          // Append the current month to the currentMonths dictionary
          if (currentMonths[currentMonth]) {
            currentMonths[currentMonth] += 1;
          } else {
            currentMonths[currentMonth] = 1;
          }
        }
      })

      // Set the hours and months variables for the data chart
      setCHours(currentHours);
      setCMonths(currentMonths);
    }

    // Set a years variable
    let years = [];

    // Append every year found in the datetime data of the crime to the years variable
    props.crimeData.datetime.forEach(dt => {
      let dtString = new Date(dt);

      let currentYear = dtString.toLocaleString('default', {year: 'numeric'});

      if (!years.includes(currentYear)) {
        years.push(currentYear);
      }
    })

    // Sort the years in descending order
    years.sort((a, b) => b - a);

    // Set the text for the line chart
    const monthsText = `${cYear > 0 ? cMax : 0} - Monthly ${capitalizeString(props.crime)} Data`;
    const hoursText = `${cYear > 0 ? cMax : 0} - Hourly ${capitalizeString(props.crime)} Data`;

    // Set the months data for the line chart
    const monthsData = {
      labels: Object.keys(cMonths),
      datasets: [{
        label: monthsText,
        data: Object.values(cMonths),
        backgroundColor: `hsl(${crimeColor[props.crime][0]}, ${crimeColor[props.crime][1]}, ${crimeColor[props.crime][2]})`,
        borderColor: 'rgb(0, 0, 0)',
        borderWidth: 1,
        borderRadius: 10
      }]
    };

    // Set the hours data of the line chart
    const hoursData = {
      labels: Object.keys(cHours),
      datasets: [{
        label: monthsText,
        data: Object.values(cHours),
        backgroundColor: `hsl(${crimeColor[props.crime][0]}, ${crimeColor[props.crime][1]}, ${crimeColor[props.crime][2]})`,
        borderColor: 'rgb(0, 0, 0)',
        borderWidth: 1,
        borderRadius: 10
      }]
    };

    return(
      <div>
        <div className="horizontally-center">
          <h2>Overall {capitalizeString(props.crime)} Crime Data</h2>
        </div>
        <ChartDropdown year={cYear} years={years} handleChartDropdownChange={handleChartDropdownChange} />
        <Container className="chart-container">
          <BarChart text={monthsText} chartData={monthsData} />
        </Container>
        <Container className="chart-container">
          <BarChart text={hoursText} chartData={hoursData} />
        </Container>
      </div>
    )
  }
  // Display a data visualizer for barangay and crime data
  else if (props.dataType === 'barangayCrime') {
    if (!props.crime) {
      return null;
    }

    // Check if the barangayCrimeData contains data
    if (props.barangayCrimeData.error) {
      return(
        <div>
          <div className="horizontally-center">
            <div>
              <h1>Barangay {capitalizeString(props.barangay)}</h1>
            </div>
          </div>
          <div className="horizontally-center">
            <h3>There are currently no data for the current crime in this barangay.</h3>
          </div>
        </div>
      )
    }

    // Dropdown handler of barangay crime data visualizer
    const handleChartDropdownChange = (event) => {
      // Set the current year chosen in the dropdown
      setBCYear(event.target.value);
      // Set the total amount of crimes in a year
      setBCMax(props.barangayCrimeData['yearly_totals'][event.target.value])

      // Set the currentMonths and currentHours dictionary for the chart
      let currentMonths = {};
      let currentHours = {};

      // Set the month names to be displayed in the chart
      const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May.', 'Jun.', 'Jul.', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

      // Append all the month names found in monthNames and insert it inside the currentMonths dictionary
      monthNames.forEach(month => {
        currentMonths[month] = 0;
      })

      // Append all possible hours in a 12-hour format inside  currentHours dictionary
      const meridiem = ['AM', 'PM']

      meridiem.forEach(currentMeridiem => {
        let firstHour = 12;
        currentHours[firstHour.toString() + ' ' + currentMeridiem] = 0;

        for (let hour = 1; hour < 12; hour++) {
          currentHours[hour.toString() + ' ' + currentMeridiem] = 0;
        }
      })

      // Iterate over every date occurrences found in the crime's data
      props.barangayCrimeData.datetime.forEach(dt => {
        // Classify the current datetime string as a date
        let dtString = new Date(dt);

        // Get the current year, month, and hour of the date
        let currentYear = dtString.toLocaleString('default', {year: 'numeric'});
        let currentMonth = dtString.toLocaleString('default', {month: 'long'}).slice(0, 3) + ".";
        let currentHour = dtString.toLocaleString('default', {hour: 'numeric', hour12: true});

        // If the current year is equal to the year chosen in the dropdown
        if (currentYear === event.target.value) {
          // Append the current hour to the currentHours dictionary
          if (currentHours[currentHour]) {
            currentHours[currentHour] += 1;
          } else {
            currentHours[currentHour] = 1;
          }

          // Append the current month to the currentMonths dictionary
          if (currentMonths[currentMonth]) {
            currentMonths[currentMonth] += 1;
          } else {
            currentMonths[currentMonth] = 1;
          }
        }
      })

      // Set the hours and months variables for the data chart
      setBCHours(currentHours);
      setBCMonths(currentMonths);
    }

    // Set a years variable
    let years = [];

    // Append every year found in the datetime data of the crime to the years variable
    props.barangayCrimeData.datetime.forEach(dt => {
      let dtString = new Date(dt);

      let currentYear = dtString.toLocaleString('default', {year: 'numeric'});

      if (!years.includes(currentYear)) {
        years.push(currentYear);
      }
    })

    // Sort the years in descending order
    years.sort((a, b) => b - a);

    // Set the text for the line chart
    const monthsText = `${bcYear > 0 ? bcMax : 0} Monthly ${capitalizeString(props.crime)} Data`;
    const hoursText = `${bcYear > 0 ? bcMax : 0} Hourly ${capitalizeString(props.crime)} Data`;

    // Set the months data for the line chart
    const monthsData = {
      labels: Object.keys(bcMonths),
      datasets: [{
        label: monthsText,
        data: Object.values(bcMonths),
        backgroundColor: `hsl(${crimeColor[props.crime][0]}, ${crimeColor[props.crime][1]}, ${crimeColor[props.crime][2]})`,
        borderColor: 'hsl(0, 0, 0)',
        borderWidth: 1,
        borderRadius: 10
      }]
    };

    // Set the hours data of the line chart
    const hoursData = {
      labels: Object.keys(bcHours),
      datasets: [{
        label: monthsText,
        data: Object.values(bcHours),
        backgroundColor: `hsl(${crimeColor[props.crime][0]}, ${crimeColor[props.crime][1]}, ${crimeColor[props.crime][2]})`,
        borderColor: 'rgb(0, 0, 0)',
        borderWidth: 1,
        borderRadius: 10
      }]
    };

    return(
      <div>
        <div className="horizontally-center">
          <h2>Barangay {capitalizeString(props.barangay)}</h2>
        </div>
        <ChartDropdown year={bcYear} years={years} handleChartDropdownChange={handleChartDropdownChange} />
        <Container className="chart-container">
          <BarChart text={monthsText} chartData={monthsData} />
        </Container>
        <Container className="chart-container">
          <BarChart text={hoursText} chartData={hoursData} />
        </Container>
      </div>
    )
  }
}

function ChartDropdown({ year, years, handleChartDropdownChange }) {
  /**
   * Dropdown for years in crime data
   */

  return(
    <div className="horizontally-center">
      <FormControl size="small" sx={{ m: 1, width: 1/2 }}>
        <InputLabel>Year</InputLabel>
        <Select
          value={year}
          onChange={handleChartDropdownChange}
          label="Barangay"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {years.map((year, index) => {
            return <MenuItem key={index} value={year}>{year}</MenuItem>
          })}
        </Select>
      </FormControl>
    </div>
  );
}

function PieChart({ chartData, labels, colors }) {
  const data =  {
    labels: labels,
    datasets: [
      {
        label: 'Amount',
        data: chartData,
        backgroundColor: colors,
        borderWidth: 1,
      }
    ],

  };

  return(
    <Pie 
      style={{backgroundColor: 'rgb(255, 255, 255, 1)', borderRadius: '5px'}}
      data={data}
    />
  )
}

function BarChart({ chartData, text }) {
  /**
   * Bar Chart for data
   */

  return(
    <Bar
      style={{backgroundColor: 'rgb(255, 255, 255, 1)', borderRadius: '5px', height: '20px'}}
      data={chartData}
      options={{
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: text
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            grid: {
              color: '#000000',
            },
            ticks: {
              precision: 0,
            },
            beginAtZero: true
          },
          x: {
            grid: {
              color: '#000000',
            }
          }
        },
        layout: {
          padding: 15,
        }
      }}
    />
  );
}

function clearHeatMap() {
  document.querySelectorAll('#paths-container > path').forEach(path => {
    if (path.getAttribute('class') !== 'active') {
      path.setAttribute('style', 'fill: ;');
    }
  });
}

function crimeVisualizer(crimeData) {
  /**
   * Crime visualizer for the map,
   * it displays a heatmap of the butuan map
   * of the crimes selected
  */

  // Verify if crimeData exists
  if (Object.keys(crimeData).length >= 1) {
    clearHeatMap();

    // Clean crime data by removing datetime array, crime, and total
    const cleanCrimeData = Object.entries(crimeData);

    let crimesTotal = 0;
    Object.values(crimeData.yearly_totals).forEach(element => {
      crimesTotal += element;
    })

    const barangaysTotal = cleanCrimeData.length;
    const scale = Math.round(crimesTotal / barangaysTotal);

    // Start at index 1
    cleanCrimeData.forEach(element => {
      if (element[0] === 'yearly_totals' || element[0] === 'crime' || element[0] === 'datetime') {
        return;
      }

      // name variable to know what is the current barangay
      const name = element[0];
      // crimeAmount variable to know the amount of crimes in the current barangay
      const crimeAmount = parseInt(element[1]);

      /**
       * Determines which color scale the current barangay is in
       * if it is lesser than average, lighten up its color
       * if it is equal to the average, the color is in default
       * if it is greater than average, darken its color
       */
      let color;
      if (crimeAmount < scale) {
        color = `hsl(${crimeColor[crimeData['crime']][0]}, 
          ${crimeColor[crimeData['crime']][1]},
          ${(parseInt(crimeColor[crimeData['crime']][2].slice(0, 2)) + 20).toString() + '%'})`;
      } else if (crimeAmount === scale) {
        color = `hsl(${crimeColor[crimeData['crime']][0]}, ${crimeColor[crimeData['crime']][1]}, ${crimeColor[crimeData['crime']][2]})`;
      } else if (crimeAmount > scale) {
        color = `hsl(${crimeColor[crimeData['crime']][0]}, 
          ${crimeColor[crimeData['crime']][1]},
          ${(parseInt(crimeColor[crimeData['crime']][2].slice(0, 2)) - 20).toString() + '%'})`;
      }

      // Color the current barangay with the chosen color
      document.querySelectorAll('#paths-container > path').forEach(path => {
        if (path.id === name) {
          path.setAttribute('style', `fill: ${color};`);
        }
      });
    });
  }
}

// Utility function/s

function capitalizeString(string) {
  /**
   * A function that replaces the underscores of barangay and crime
   * names to space, and capitalizes the first letters
   */
  let new_string = '';

  string = string.replaceAll('_', ' ');

  for (let j = 0; j < string.length; j++) {
    if (!string[j-1] || string[j-1] === ' ') {
      new_string += string[j].toUpperCase();
    } else {
      new_string += string[j];
    }
  }

  return new_string;
}
