import 'package:dio/dio.dart';
import '../constants/app_constants.dart';
import 'cookie_helper.dart' as cookies;

class ApiClient {
  static ApiClient? _instance;
  late final Dio dio;

  ApiClient._();

  static ApiClient get instance {
    _instance ??= ApiClient._();
    return _instance!;
  }

  Future<void> init() async {
    dio = Dio(BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      followRedirects: true,
      maxRedirects: 5,
    ));

    // Attach persistent cookie manager on iOS/Android; web uses browser cookies.
    await cookies.attachCookies(dio);
  }

  Future<void> clearCookies() async {
    await cookies.clearAllCookies();
  }
}
