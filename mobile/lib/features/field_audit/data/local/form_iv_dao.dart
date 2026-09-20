import 'package:sqflite/sqflite.dart';
import '../../../../core/constants/db_constants.dart';
import '../../../../core/storage/local_db_service.dart';
import '../models/form_iv_local_model.dart';

/// Form IV Data Access Object (DAO)
///
/// Executes offline CRUD and sync-state transformations on the embedded
/// SQLite `local_form_iv_inspections` table.
class FormIvDao {
  final LocalDbService _dbService;

  FormIvDao({LocalDbService? dbService})
      : _dbService = dbService ?? LocalDbService.instance;

  /// Inserts a new inspection record into local storage with PENDING sync status
  Future<void> insertInspection(FormIvLocalModel record) async {
    final db = await _dbService.database;
    await db.insert(
      DbConstants.formIvInspectionsTable,
      record.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Retrieves all inspections that have not yet been synchronized with the surface backend
  Future<List<FormIvLocalModel>> getPendingInspections() async {
    final db = await _dbService.database;
    final List<Map<String, dynamic>> maps = await db.query(
      DbConstants.formIvInspectionsTable,
      where: 'sync_status = ?',
      whereArgs: [DbConstants.statusPending],
      orderBy: 'inspection_time ASC',
    );

    return List.generate(maps.length, (i) => FormIvLocalModel.fromMap(maps[i]));
  }

  /// Updates the sync status of specified inspection records to SYNCED
  Future<int> markAsSynced(List<String> ids) async {
    if (ids.isEmpty) return 0;
    final db = await _dbService.database;

    final batch = db.batch();
    for (final id in ids) {
      batch.update(
        DbConstants.formIvInspectionsTable,
        {'sync_status': DbConstants.statusSynced},
        where: 'id = ?',
        whereArgs: [id],
      );
    }
    final results = await batch.commit(noResult: false);
    return results.length;
  }

  /// Returns total count of pending offline audits awaiting surface sync
  Future<int> getPendingCount() async {
    final db = await _dbService.database;
    final count = Sqflite.firstIntValue(await db.rawQuery(
      'SELECT COUNT(*) FROM ${DbConstants.formIvInspectionsTable} WHERE sync_status = ?',
      [DbConstants.statusPending],
    ));
    return count ?? 0;
  }

  /// Retrieves full history of local audits ordered by newest first
  Future<List<FormIvLocalModel>> getAllInspections({int limit = 50}) async {
    final db = await _dbService.database;
    final List<Map<String, dynamic>> maps = await db.query(
      DbConstants.formIvInspectionsTable,
      orderBy: 'inspection_time DESC',
      limit: limit,
    );

    return List.generate(maps.length, (i) => FormIvLocalModel.fromMap(maps[i]));
  }

  /// Fetches a single audit entry by primary identifier
  Future<FormIvLocalModel?> getInspectionById(String id) async {
    final db = await _dbService.database;
    final List<Map<String, dynamic>> maps = await db.query(
      DbConstants.formIvInspectionsTable,
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );

    if (maps.isEmpty) return null;
    return FormIvLocalModel.fromMap(maps.first);
  }

  /// Deletes a local record (e.g. purged after statutory verification)
  Future<int> deleteInspection(String id) async {
    final db = await _dbService.database;
    return await db.delete(
      DbConstants.formIvInspectionsTable,
      where: 'id = ?',
      whereArgs: [id],
    );
  }
}
