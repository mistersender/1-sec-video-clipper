<template>
  <section v-if="sortedVideos" class="c-video-clipper">
    <label class="c-label" for="saveMonth">Save for date</label>
    <div>
      <input class="c-input saveDate" type="text" maxlength="2" v-model="saveMonth" id="saveMonth">
      -
      <input class="c-input saveDate" type="text" maxlength="2" v-model="saveDay" id="saveDay">
      -
      <input class="c-input saveDate--year" type="text" maxlength="4" v-model="saveYear" id="saveYear">
    </div>
    <br>
    <div class="c-label">Video/Photo Options</div>
    <section class="c-video-options">
      <div v-for="opt in selectedDay.options" v-bind:key="opt" v-on:click="tryVideo(opt)" class="c-video-options__option">
        <img :src="opt.screenshotLocation" class="cal__video-ss">
      </div>
      <div v-if="!selectedDay.options || !(selectedDay.options && selectedDay.options.length)" v-for="placeholder in [1,2,3]" v-bind:key="placeholder" class="c-video-options__placeholder"></div>
    </section>
    <br>
    <section class="cal">
      <div class="cal__header">
        <button type="button" class="c-button cal__move" @click.prevent="updateMonth(-1)"><<</button>
        <h2 class="cal__month">{{mm(currentMonth).format('MMMM')}} {{currentYear}}</h2>
        <button type="button" class="c-button cal__move" @click.prevent="updateMonth(1)">>></button>
      </div>
      <div class="cal__week">
        <div class="cal__day">Sun</div>
        <div class="cal__day">Mon</div>
        <div class="cal__day">Tues</div>
        <div class="cal__day">Wed</div>
        <div class="cal__day">Thurs</div>
        <div class="cal__day">Fri</div>
        <div class="cal__day">Sat</div>
      </div>
      <div class="cal__week" v-for="week in calendar" v-bind:key="week">
        <div class="cal__day" v-for="day in week.days" v-bind:key="day" v-on:click="getVideosForDay(day)">
          <div v-if="mm(day).format('MM') == currentMonth" :class="(sortedVideos[currentYear][currentMonth] && sortedVideos[currentYear][currentMonth][currentDay(day)] && sortedVideos[currentYear][currentMonth][currentDay(day)].isComplete) ? 'is-done' : ''">
            <span class="cal__day__num">{{currentDay(day)}}</span>
            <div v-if="sortedVideos[currentYear][currentMonth] && sortedVideos[currentYear][currentMonth][currentDay(day)]" >
              <div v-if="sortedVideos[currentYear][currentMonth][currentDay(day)].isComplete" class="cal__completed-video">
                <img :src="sortedVideos[currentYear][currentMonth][currentDay(day)].selectedVideo.screenshotLocation" class="cal__video-ss">
              </div>
              <div v-else class="cal__video-count">
                {{sortedVideos[currentYear][currentMonth][currentDay(day)].options.length}} Videos
              </div>
            </div>
            <div v-else class="cal__no-videos">
              No videos
            </div>
          </div>
          <div class="cal__different-month" v-else>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>
<script>
import moment from 'moment'
export default {
  components: {
    'moment': moment
  },
  created(){
    this.getVideos()
    document.addEventListener('saveCompleted', this.updateFromSave, false);
  },
  watch: {
    desiredMonth: function(){
      this.currentMonth = `0${this.desiredMonth}`.slice(-2)
      this.buildCalendar()
      this.updateRoute()
    }
  },
  data() {
    return {
      calendar: [],
      currentYear: moment().format('YYYY'),
      currentMonth: moment().format('MM'),
      sortedVideos: null,
      selectedDay: {},
      desiredMonth: moment().format('MM'),
      saveMonth: '',
      saveDay: '',
      saveYear: ''
    }
  },
  mounted(){
    if(this.$route.params.month){
      this.currentMonth = this.$route.params.month
      this.desiredMonth = this.$route.params.month
    }
    if(this.$route.params.year){
      this.currentYear = this.$route.params.year
    }
    this.updateRoute()
  },
  methods: {
    updateMonth(increaseBy){
      let currentMonth = parseInt(this.currentMonth)
      if(increaseBy > 0 && currentMonth == 12){
        this.desiredMonth = 1
        this.updateYear(parseInt(this.currentYear) + 1)
        return
      }
      if(increaseBy < 0 && currentMonth == 1){
        this.desiredMonth = 12
        this.updateYear(parseInt(this.currentYear) - 1)
        return
      }
      this.desiredMonth = currentMonth + increaseBy
    },
    updateYear(year){
      this.currentYear = year
      this.updateRoute()
    },
    updateFromSave(e){
      let dateInfo = e.detail.dateInfo
      let forceUpdate = false
      if(!this.sortedVideos[dateInfo.year]){
        this.sortedVideos[dateInfo.year] = {}
      }
      if(!this.sortedVideos[dateInfo.year][dateInfo.month]){
        this.sortedVideos[dateInfo.year][dateInfo.month] = {}
      }
      if(!this.sortedVideos[dateInfo.year][dateInfo.month][dateInfo.day]){
        this.sortedVideos[dateInfo.year][dateInfo.month][dateInfo.day] = {
          isComplete: false,
          selectedVideo: {},
          options: []
        }
        forceUpdate = true
      }
      this.sortedVideos[dateInfo.year][dateInfo.month][dateInfo.day].isComplete = true
      this.sortedVideos[dateInfo.year][dateInfo.month][dateInfo.day].selectedVideo = e.detail
      if(forceUpdate){
        this.$forceUpdate()
      }
    },
    currentDay: (date) => moment(date).format('DD').toString(),
    mm(arg){
      return moment(arg)
    },
    getVideosForDay(rawDayValue){
      let day
      try{
        day = this.sortedVideos[this.currentYear][this.currentMonth][this.currentDay(rawDayValue)]
      } catch(e){
        return // if we don't have it, then just stop
      }
      if(day.options.length){
        this.tryVideo(day.options[0])
      }
      if(day.selectedVideo.clipLocation){
        videoClipper.showClippedVideo(day.selectedVideo.clipLocation)
      }
      this.selectedDay = day
    },
    tryVideo(opt){
      this.saveMonth = opt.dateInfo.month
      this.saveDay = opt.dateInfo.day
      this.saveYear = opt.dateInfo.year
      videoClipper.edit(opt.videoLocation)
    },
    updateRoute(){
      if(this.$route.params.month != this.currentMonth || this.$route.params.year != this.currentYear){
        this.$router.replace(`/${this.currentYear}/${this.currentMonth}`)
      }
    },
    getVideos(){
      fetch('/clips')
        .then(r => r.json())
        .then((r) => {
          this.sortedVideos = r.items
          this.buildCalendar()
        })
        .catch(console.error)
    },
    buildCalendar(){
      if(!this.sortedVideos){
        return
      }
      const currentMonth = moment(`${this.currentYear}-${this.currentMonth}-01`)
      const startWeek = currentMonth.startOf('month').week();
      let endWeek = currentMonth.endOf('month').week();
      if(endWeek == 1){
        endWeek = 53 // this is to fix a bug with december, which can "end" in january for a full week cycle
      }

      let calendar = []
      for(var week = startWeek; week <= endWeek; week++){
        calendar.push({
          week: week,
          days: Array(7).fill(0).map((n, i) => currentMonth.week(week).startOf('week').clone().add(n + i, 'day'))
        })
      }
      this.calendar = calendar
    }
    
  }
}
</script>
<style lang="stylus">
.c-video-clipper
  min-height: 80rem
.c-video-options
  display flex
  flex-flow: row nowrap
  min-height: 5rem
  &__option
    cursor: pointer
    box-shadow: 0 0 0 0 #cdcdcd 
    transition: all 0.2s ease-out
    &:hover
      box-shadow: 0 0 0 0.2rem #cdcdcd
    &:active
      box-shadow: 0 0 0 0.3rem darken(#cdcdcd, 20%)
    & + &
      margin-left: 0.4rem
  &__placeholder
    height: 5rem
    width: 7rem
    background: #cdcdcd
    & + &
      margin-left: 0.5em
.cal
  border: 0.1rem solid #cdcdcd
// .cal__month
//   border-bottom: 0.1rem solid #cdcdcd
.cal__header
    display: flex
    justify-content: space-between;
    align-items: center;
.cal__move
    flex: 0 0 auto
    margin: 0 1em
.cal__week
  display: flex
  flex-flow: row-nowrap
  border-top: 0.1rem solid #cdcdcd

.cal__day
  min-height: 30px
  flex: 1 1 15rem
  padding: 0.2rem
  cursor: pointer
  box-shadow: 0 0 0 0 #cdcdcd inset 
  transition: all 0.2s ease-out
  position: relative
  &:hover
    box-shadow: 0 0 0 0.2rem #cdcdcd inset
  &:active
    box-shadow: 0 0 0 0.3rem darken(#cdcdcd, 20%) inset
  & + &
    border-left: 0.1rem solid #cdcdcd
.cal__day__num
  position: absolute
  
.cal__different-month
  width: 100%
  height: 100%
  background: #ddd
.cal__video-ss
  max-width: 75px
  max-height: 50px
.is-done
  background: rgba(#4CAF50, 30%)
  min-height: 25px
.cal__completed-video
  text-align center
  min-height: 52px
.cal__no-videos
  background: rgba(#E15543, 30%)
  padding: 1.2em 0 0.5em
  min-height: 25px
.cal__video-count
  padding: 1.2em 0 0.5em
  min-height: 25px
</style>