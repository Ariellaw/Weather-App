import { Component, OnInit, Input } from '@angular/core'
import { LocationService } from '../services/location.service'
import { ForecastService } from '../services/forecast.service'
import { WeeklyForecast } from '../models/weekly-forecast.model'
import { DailyForecast } from '../models/daily-forecast.model'
import { Locations } from '../models/locations.model'
import { CurrentWeather } from '../models/current-weather.model'
import { FavoritesService } from '../services/favorites.service'
import { ActivatedRoute, Router } from '@angular/router'
import * as constants from '../models/constants'

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.scss'],
  providers: [LocationService, ForecastService]
})
export class WeatherComponent implements OnInit {
  DAYS_IN_WEEK:number = 5;
  location: string = 'Tel Aviv, Israel'
  locationIsInFavorites: boolean = false
  locationKey: string = '215854'
  suggestedLocations: Locations[]
  weeklyForecast: WeeklyForecast = new WeeklyForecast([])
  displayedDayForecast: DailyForecast = null
  currentWeather: CurrentWeather = null
  currentWeatherDisplayed: boolean = true
  selectedWeatherForecast: number = null
  errorMessage: string = null
  isLoadingCurrentWeather: boolean = true
  isLoadingWeeklyForecast: boolean = true
  units: string = constants.units.fahrenheit
  darkmode: boolean

  constructor (
    private locationService: LocationService,
    private forecastService: ForecastService,
    private favoritesService: FavoritesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit () {
    let id = this.route.snapshot.paramMap.get('id')
    let location = this.route.snapshot.paramMap.get('locationName')
    this.darkmode = this.favoritesService.getDarkMode()

    this.route.queryParams.subscribe(queryParams => {
      this.units = queryParams.units
      this.loadForecast(id, location, this.units)
    })
    this.favoritesService.darkModeChanged.subscribe((darkmode: boolean) => {
      this.darkmode = darkmode
    })
  }

  onUserInput ($event) {
    const input = $event.target.value
    if (input.length >= 2) {
      this.locationService
        .getSuggestedLocations(input)
        .then(locations => {
          this.suggestedLocations = locations
        })
        .catch(error => {
          console.log('onUserInput', error)
          this.errorMessage = error
        })
    }
  }
  getWeeklyForecast (locationKey: string, unitsOfMeasurment: string) {
    this.forecastService
      .getWeeklyForecast(locationKey, unitsOfMeasurment)
      .then(weeklyForecast => {
        this.weeklyForecast = weeklyForecast
        this.isLoadingWeeklyForecast = false
        if (this.selectedWeatherForecast) {
          this.displayedDayForecast = this.weeklyForecast.dailyForecasts[
            this.selectedWeatherForecast
          ]
        }
      })
      .catch(error => {
        console.log('getWeeklyForecast', error)

        this.errorMessage = error
        this.isLoadingWeeklyForecast = false
      })
  }

  getCurrentWeather (locationKey: string) {
    this.currentWeather = null
    this.forecastService
      .getCurrentWeather(locationKey)
      .then(currentWeather => {
        this.currentWeather = currentWeather
        this.isLoadingCurrentWeather = false
      })
      .catch(error => {
        this.errorMessage = error
        this.isLoadingCurrentWeather = false
        console.log('current weather error', error)
      })
  }

  onUserSelection ($event) {
    this.currentWeatherDisplayed = true
    const location = $event.target.value
    const option = document.querySelector(
      "#locations option[value='" + location + "']"
    )
    const locationKey = option.getAttribute('data-value')
    this.loadForecast(locationKey, location, this.units)

    this.router.navigate(['/', this.location, locationKey], {
      relativeTo: this.route,
      queryParamsHandling: 'merge'
    })
  }

  displayForecast (idx: number) {
    this.currentWeatherDisplayed = false
    this.selectedWeatherForecast = idx
    this.displayedDayForecast = this.weeklyForecast.dailyForecasts[idx]
  }

  addLocationToFavorites () {
    this.favoritesService.addLocationToFavorites({
      cityName: this.location.split(',')[0],
      countryName: this.location.split(',')[1],
      locationKey: this.locationKey
    })
    this.locationIsInFavorites = true
  }

  removeLocationFromFavorites () {
    this.favoritesService.removeLocationFromFavorites(this.locationKey)
    this.locationIsInFavorites = false
  }
  isLocationInFavorites (locationKey: string) {
    this.locationIsInFavorites = this.favoritesService.isLocationInFavorites(
      locationKey
    )
  }

  loadForecast (
    id: string = this.locationKey,
    location: string = this.location,
    unitsOfMeasurment: string
  ) {
    this.isLoadingWeeklyForecast = true
    this.isLoadingCurrentWeather = true

    if (id && location) {
      this.locationKey = id
      this.location = location
    }
    this.getCurrentWeather(this.locationKey)
    this.isLocationInFavorites(this.locationKey)
    this.getWeeklyForecast(this.locationKey, unitsOfMeasurment)
  }
}
