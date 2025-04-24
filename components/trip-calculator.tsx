"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Check, ChevronsUpDown, Plane } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

// Define the form schema with explicit required fields
const formSchema = z.object({
  internationalTrip: z.boolean(),
  seniorityYears: z.coerce.number().min(0, "Seniority years must be a positive number"),
  tafb: z.coerce.number().min(0, "TAFB must be a positive number"),
  hourlyRate: z.coerce.number().min(0, "Hourly rate must be a positive number"),
  credit: z.coerce.number().min(0, "Credit hours must be a positive number"),
  position: z.enum(["Speaker", "Galley", "Purser"]),
  isMexicoCaribbean: z.boolean(),
  nightPayHours: z.coerce.number().min(0, "Night pay hours must be a positive number"),
  // These are truly optional fields
  aircraft: z.string().optional(),
  hoursInWidebody: z.coerce.number().min(0, "Hours in widebody must be a positive number").optional(),
})

// Define the type explicitly to match the schema
type FormValues = {
  internationalTrip: boolean
  seniorityYears: number
  tafb: number
  hourlyRate: number
  credit: number
  position: "Speaker" | "Galley" | "Purser"
  isMexicoCaribbean: boolean
  nightPayHours: number
  aircraft?: string
  hoursInWidebody?: number
}

const aircraftOptions = [
  { value: "A319", label: "A319" },
  { value: "A320", label: "A320" },
  { value: "B737", label: "B737" },
  { value: "B737-800", label: "B737-800" },
  { value: "B737-900", label: "B737-900" },
  { value: "B757", label: "B757" },
  { value: "widebody", label: "Widebody" },
]

export function TripCalculator() {
  const [results, setResults] = useState<{
    perdiem: number
    perdiemValue: number
    positionCredit: number
    internationalCredit: number
    nightPayCredit: number
    totalTripValue: number
  } | null>(null)

  // Use the explicit FormValues type
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      internationalTrip: false,
      seniorityYears: 0,
      tafb: 0,
      hourlyRate: 0,
      credit: 0,
      position: "Speaker",
      isMexicoCaribbean: false,
      hoursInWidebody: 0,
      nightPayHours: 0,
    },
  })

  const watchPosition = form.watch("position")
  const watchInternationalTrip = form.watch("internationalTrip")

  function calculateTripValue(values: FormValues) {
    // Calculate per diem based on seniority and international status
    const seniorityFactor = Math.floor(values.seniorityYears / 2)
    let perdiem = 0

    if (values.internationalTrip) {
      perdiem = 2.7 + seniorityFactor * 0.05
    } else {
      perdiem = 2.2 + seniorityFactor * 0.05
    }

    // Calculate per diem value
    const perdiemValue = values.tafb * perdiem

    // Calculate international credit
    const internationalCredit = values.internationalTrip ? values.credit * 2 : 0

    // Calculate position credit
    let positionCredit = 0

    if (values.position === "Purser") {
      if (["A319", "A320", "B737"].includes(values.aircraft || "")) {
        positionCredit = values.isMexicoCaribbean ? values.credit * 2 : values.credit * 1
      } else if (["B737-800", "B737-900", "B757"].includes(values.aircraft || "")) {
        positionCredit = values.isMexicoCaribbean ? values.credit * 3 : values.credit * 2
      } else if (values.aircraft === "widebody") {
        positionCredit = values.isMexicoCaribbean ? values.credit * 4 : values.credit * 3
      }
    } else if (values.position === "Galley") {
      positionCredit = values.hoursInWidebody || 0
    } else if (values.position === "Speaker") {
      positionCredit = values.credit * 2.5
    }

    // Calculate night pay credit
    const nightPayCredit = values.nightPayHours / 2

    // Calculate total trip value
    const baseValue = values.hourlyRate * values.credit
    const totalTripValue = baseValue + perdiemValue + positionCredit + internationalCredit + nightPayCredit

    return {
      perdiem,
      perdiemValue,
      positionCredit,
      internationalCredit,
      nightPayCredit,
      totalTripValue,
    }
  }

  function onSubmit(values: FormValues) {
    const calculationResults = calculateTripValue(values)
    setResults(calculationResults)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
          <CardDescription>Enter your trip information to calculate the total value.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="internationalTrip"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">International Trip</FormLabel>
                      <FormDescription>Is this an international trip?</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seniorityYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seniority Years</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tafb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TAFB (hours)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="credit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit (hours)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Speaker">Speaker</SelectItem>
                        <SelectItem value="Galley">Galley</SelectItem>
                        <SelectItem value="Purser">Purser</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchPosition === "Purser" && (
                <>
                  <FormField
                    control={form.control}
                    name="aircraft"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Aircraft</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                              >
                                {field.value
                                  ? aircraftOptions.find((aircraft) => aircraft.value === field.value)?.label
                                  : "Select aircraft"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search aircraft..." />
                              <CommandList>
                                <CommandEmpty>No aircraft found.</CommandEmpty>
                                <CommandGroup>
                                  {aircraftOptions.map((aircraft) => (
                                    <CommandItem
                                      value={aircraft.label}
                                      key={aircraft.value}
                                      onSelect={() => {
                                        form.setValue("aircraft", aircraft.value)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          aircraft.value === field.value ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      {aircraft.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isMexicoCaribbean"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Mexico/Caribbean/Central America/Alaska/Hawaii</FormLabel>
                          <FormDescription>Is this trip to one of these destinations?</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {watchPosition === "Galley" && (
                <FormField
                  control={form.control}
                  name="hoursInWidebody"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours in Widebody</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="nightPayHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Night Pay Hours</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Calculate Trip Value
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trip Value Results</CardTitle>
          <CardDescription>Breakdown of your trip value calculation.</CardDescription>
        </CardHeader>
        <CardContent>
          {results ? (
            <div className="space-y-6">
              <div className="rounded-lg bg-muted p-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold">Total Trip Value</h3>
                  <p className="text-4xl font-bold text-primary mt-2">${results.totalTripValue.toFixed(2)}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Calculation Breakdown</h3>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">Per Diem Rate:</div>
                  <div className="text-sm font-medium text-right">${results.perdiem.toFixed(2)}/hr</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">Per Diem Value:</div>
                  <div className="text-sm font-medium text-right">${results.perdiemValue.toFixed(2)}</div>
                </div>

                {watchInternationalTrip && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm">International Credit:</div>
                    <div className="text-sm font-medium text-right">${results.internationalCredit.toFixed(2)}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">Position Credit:</div>
                  <div className="text-sm font-medium text-right">${results.positionCredit.toFixed(2)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">Night Pay Credit:</div>
                  <div className="text-sm font-medium text-right">${results.nightPayCredit.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <Plane className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Calculation Yet</h3>
              <p className="text-muted-foreground">
                Fill out the trip details form and click calculate to see your trip value.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
