"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  LogOut,
  Map,
  Plus,
  Search,
  Trash2,
  Upload,
  Edit,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GeoRecord,
  createGeoRecord,
  deleteGeoRecord,
  readGeoRecords,
  updateGeoRecord,
} from "@/lib/krtkova-mapa/database";
import { geocodeCity } from "@/lib/krtkova-mapa/geocoding";

const ITEMS_PER_PAGE = 10;

export default function KrtkovaMapaCrudPage() {
  const router = useRouter();
  const [records, setRecords] = useState<GeoRecord[]>([]);
  const [formData, setFormData] = useState<Omit<GeoRecord, "id">>({
    latitude: "",
    longitude: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [ready] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("isAuthenticated") === "true",
  );

  useEffect(() => {
    if (!ready) {
      router.replace("/krtkova-mapa/login");
      return;
    }
    const loadRecords = async () => {
      const loadedRecords = await readGeoRecords();
      setRecords(loadedRecords);
    };
    loadRecords();
  }, [ready, router]);

  const filteredRecords = useMemo(
    () =>
      records.filter((record) =>
        record.description.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [records, searchTerm],
  );

  const pageCount = Math.max(
    1,
    Math.ceil(filteredRecords.length / ITEMS_PER_PAGE),
  );
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const loadRecords = async () => {
    const loadedRecords = await readGeoRecords();
    setRecords(loadedRecords);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    if (editingId) {
      await updateGeoRecord(editingId, formData);
    } else {
      await createGeoRecord(formData);
    }
    setFormData({ latitude: "", longitude: "", description: "" });
    setEditingId(null);
    await loadRecords();
    setLoading(false);
  };

  const handleEdit = (record: GeoRecord) => {
    setFormData(record);
    setEditingId(record.id ?? null);
  };

  const handleDelete = async (id: number) => {
    await deleteGeoRecord(id);
    await loadRecords();
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    router.push("/krtkova-mapa/login");
  };

  const handleCitySearch = async () => {
    if (!citySearch.trim()) return;
    const result = await geocodeCity(citySearch);
    if (result) {
      setFormData((prev) => ({
        ...prev,
        latitude: result.lat,
        longitude: result.lon,
        description: `# ${citySearch}\n\n${prev.description}`,
      }));
    } else {
      alert("Obec nenalezena, zkuste to znovu.");
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(records, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", "geo_records.json");
    linkElement.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        try {
          const importedRecords = JSON.parse(content) as GeoRecord[];
          for (const record of importedRecords) {
            const recordWithoutId = {
              latitude: record.latitude,
              longitude: record.longitude,
              description: record.description,
            };
            await createGeoRecord(recordWithoutId);
          }
          await loadRecords();
          alert("Import byl úspěšně dokončen.");
        } catch (error) {
          console.error("Error importing JSON:", error);
          alert("Chyba při importu JSON souboru. Zkontrolujte formát souboru.");
        }
      }
    };
    reader.readAsText(file);
  };

  if (!ready) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Správa dat</CardTitle>
              <p className="text-sm text-muted-foreground">
                Spravujte záznamy a připravujte body pro mapu.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" asChild>
                <Link href="/krtkova-mapa">
                  <Map className="mr-2 h-4 w-4" />
                  Zobrazit mapu
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Odhlásit
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Přidat nebo upravit záznam</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="city-search">Najít obec podle názvu</Label>
                  <Input
                    id="city-search"
                    value={citySearch}
                    onChange={(event) => setCitySearch(event.target.value)}
                    placeholder="Zadejte název obce"
                  />
                </div>
                <Button
                  type="button"
                  className="mt-6 h-10"
                  onClick={handleCitySearch}
                  disabled={loading}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Najít
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Zeměpisná šířka</Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    onChange={(event) =>
                      setFormData({ ...formData, latitude: event.target.value })
                    }
                    placeholder="Např. 50.087"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Zeměpisná délka</Label>
                  <Input
                    id="longitude"
                    value={formData.longitude}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        longitude: event.target.value,
                      })
                    }
                    placeholder="Např. 14.421"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Popis (Markdown)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      description: event.target.value,
                    })
                  }
                  rows={8}
                  required
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={loading}>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? "Uložit změny" : "Přidat záznam"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      latitude: "",
                      longitude: "",
                      description: "",
                    });
                    setEditingId(null);
                  }}
                >
                  Vyčistit
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleExport}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
                <label className="inline-flex cursor-pointer items-center">
                  <Input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleImport}
                  />
                  <Button type="button" variant="secondary" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Import JSON
                    </span>
                  </Button>
                </label>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Seznam záznamů</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Filtrovat podle textu"
                className="w-64"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Popis</TableHead>
                    <TableHead>Souřadnice</TableHead>
                    <TableHead className="text-right">Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="max-w-lg whitespace-pre-wrap">
                        {record.description}
                      </TableCell>
                      <TableCell>
                        {record.latitude}, {record.longitude}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Upravit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(record.id!)}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Smazat
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm">
                        Žádné záznamy k zobrazení.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Strana {currentPage} z {pageCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Předchozí
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(pageCount, prev + 1))
                  }
                  disabled={currentPage === pageCount}
                >
                  Další
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
